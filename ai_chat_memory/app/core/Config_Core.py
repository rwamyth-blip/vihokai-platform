from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "AI Chat Memory API"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_chat"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    OPENAI_API_KEY: str = ""
    CHAT_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536

    MAX_MEMORIES_PER_REQUEST: int = 5
    MAX_HISTORY_MESSAGES: int = 15
    MIN_MEMORY_CONFIDENCE: float = 0.7


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()