"""
Keycloak JWT authentication via JWKS.

When DEV_MODE=true, falls back to the first user in the database.
When Keycloak is configured, validates the Bearer token against the
Keycloak JWKS endpoint and extracts `preferred_username` to look up
(or auto-create) the user.
"""

import httpx
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User, Affiliation

_bearer = HTTPBearer(auto_error=False)

# Cache JWKS keys in memory (refreshed on key miss)
_jwks_cache: dict | None = None


async def _fetch_jwks() -> dict:
    """Fetch the JWKS from Keycloak's well-known endpoint."""
    global _jwks_cache
    url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
    async with httpx.AsyncClient(verify=True, timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


async def _get_jwks() -> dict:
    """Return cached JWKS or fetch fresh."""
    if _jwks_cache is not None:
        return _jwks_cache
    return await _fetch_jwks()


def _find_key(jwks: dict, kid: str) -> dict | None:
    """Find the matching key in the JWKS by kid."""
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def _decode_token(token: str) -> dict:
    """Decode and verify a Keycloak JWT using JWKS."""
    # Read unverified header to get the kid
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token header")

    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token missing kid")

    # Find the key in JWKS
    jwks = await _get_jwks()
    key = _find_key(jwks, kid)

    # If key not found, refresh JWKS (key rotation) and retry once
    if key is None:
        jwks = await _fetch_jwks()
        key = _find_key(jwks, kid)

    if key is None:
        raise HTTPException(status_code=401, detail="Token signing key not found in JWKS")

    # Decode and verify
    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.KEYCLOAK_CLIENT_ID,
            issuer=f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}",
            options={"verify_aud": bool(settings.KEYCLOAK_CLIENT_ID)},
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")

    return payload


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolve the current user.

    - With Keycloak enabled: decode JWT, extract preferred_username,
      look up or auto-create the user in the database.
    - With DEV_MODE: return the first user in the database (seed required).
    """
    keycloak_enabled = bool(settings.KEYCLOAK_URL and settings.KEYCLOAK_REALM)

    # ── Dev mode fallback ─────────────────────────────────────────────
    if not keycloak_enabled or settings.DEV_MODE:
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="No user found. Run POST /api/v1/seed first.")
        return user

    # ── Keycloak JWT verification ─────────────────────────────────────
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header required")

    payload = await _decode_token(credentials.credentials)

    preferred_username = payload.get("preferred_username")
    if not preferred_username:
        raise HTTPException(status_code=401, detail="preferred_username not found in token")

    # Look up user by email or preferred_username
    email = payload.get("email", f"{preferred_username}@skhynix.com")
    result = await db.execute(
        select(User).where(
            (User.email == email) | (User.email == preferred_username)
        )
    )
    user = result.scalar_one_or_none()

    # Auto-create user if not found
    if not user:
        # Extract additional claims
        name = payload.get("name") or payload.get("given_name", preferred_username)
        # Try to determine affiliation from groups or custom claims
        groups = payload.get("groups", [])
        affiliation = "SK하이닉스"  # default
        for g in groups:
            if "AX" in g.upper():
                affiliation = "SK AX"
                break
            elif "협력" in g or "partner" in g.lower():
                affiliation = "협력사"
                break

        team = payload.get("department", "") or payload.get("team", "")

        user = User(
            name=name,
            email=email,
            affiliation=affiliation,
            team=team,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
