import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Bắt buộc phải có dòng này để load file .env
load_dotenv()

class Settings(BaseSettings):
    FASTAPI_PORT: int = int(os.getenv("FASTAPI_PORT", 8000))
    HF_EMBEDDING_MODEL: str = os.getenv("HF_EMBEDDING_MODEL", "keepitreal/vietnamese-sbert")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/shoptech")

    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")

    HUGGINGFACEHUB_API_TOKEN: str = os.getenv("HUGGINGFACEHUB_API_TOKEN", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()