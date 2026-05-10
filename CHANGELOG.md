# Changelog

## v0.1.0 (2026-05-10)

### Features
- **Seat booking**: SVG floor map with pan/zoom, click-to-book modal, real-time status display
- **Room booking**: time grid (08:00–19:00, 30min slots), drag-to-select, booking modal with title/attendees
- **My reservations**: upcoming/past tabs, grouped by date, cancel with confirmation
- **Admin layout editor**: drag seat/room/zone placement, floor plan upload, auto-detect (beta), property panel
- **Admin permissions**: affiliation-based floor access (SK하이닉스, SK AX, 협력사)
- **Admin statistics**: hourly occupancy chart, room usage ranking, floor comparison
- **Multi-campus support**: Campus → Building → Floor hierarchy (분당/이천/청주)
- **Affiliation access control**: bookable vs view-only floors based on user affiliation
- **Calendar date picker**: monthly grid with today/tomorrow shortcuts
- **Mobile responsive**: bottom tab navigation, collapsible sidebar

### Infrastructure
- **Backend**: FastAPI + async SQLAlchemy + PostgreSQL (asyncpg)
- **Frontend**: React 18 + Babel in-browser, nginx-served static files
- **Docker**: multi-stage backend build, nginx frontend, docker-compose for local dev
- **Helm chart**: full Kubernetes deployment (backend, frontend, ingress, HPA, PostgreSQL StatefulSet)
- **Keycloak SSO**: ready (disabled by default, toggle via values.yaml)
- **Alembic**: migration framework configured

### API Endpoints
- `GET /api/v1/campuses` — campus/building/floor hierarchy
- `GET /api/v1/floors/{id}` — floor detail with seats, rooms, zones
- `PUT /api/v1/floors/{id}/layout` — admin layout save
- `GET /api/v1/reservations/my` — user's reservations
- `POST /api/v1/reservations` — create booking (with affiliation check)
- `DELETE /api/v1/reservations/{id}` — cancel booking
- `GET /api/v1/users/me` — current user
- `GET /api/v1/affiliations` — affiliation list with bookable floors
- `GET /api/v1/admin/stats/{floor_id}` — occupancy statistics
- `POST /api/v1/seed` — seed demo data (dev mode only)
