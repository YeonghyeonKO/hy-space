from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://hyspace:changeme@localhost:5432/hyspace"
    CORS_ORIGINS: str = "http://localhost:8080,http://localhost:3000"
    DEV_MODE: bool = True

    KEYCLOAK_URL: str = ""
    KEYCLOAK_REALM: str = ""
    KEYCLOAK_CLIENT_ID: str = ""
    KEYCLOAK_CLIENT_SECRET: str = ""
    KEYCLOAK_EMPLOYEE_CLAIM: str = "empno"

    class Config:
        env_file = ".env"


settings = Settings()
