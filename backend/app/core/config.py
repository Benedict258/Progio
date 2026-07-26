from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://progio:progio_secret@localhost:5432/progio"
    SYNC_DATABASE_URL: str = "postgresql://progio:progio_secret@localhost:5432/progio"

    class Config:
        env_file = ".env"


settings = Settings()
