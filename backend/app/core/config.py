import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Planto"
    PROJECT_VERSION: str = "1.0.0"
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "planto_db")
    
    # Use direct URL if provided in .env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_JDZW9M4tvnbh@ep-dry-base-ankwllos-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_CHANGEME")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    SMTP_EMAIL: str = os.getenv("SMTP_EMAIL", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    OPENWEATHER_API_KEY: str = os.getenv("VITE_OPENWEATHER_API_KEY", "")

settings = Settings()
