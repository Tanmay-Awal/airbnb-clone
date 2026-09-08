import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Airbnb Clone API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./airbnb.db"
    
    # Security
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION-USE-RANDOM-SECRET"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    DEMO_MODE: bool = True  # Set False in production to disable demo login endpoints
    
    # Business Logic Constants (Fees)
    CLEANING_FEE_FIXED: int = 1500  # ₹1,500 fixed cleaning fee
    SERVICE_FEE_PERCENTAGE: float = 0.10  # 10% platform service fee
    
    # Backend & Frontend URLs
    FRONTEND_URL: str = "http://localhost:3000"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

# Ensure FRONTEND_URL is included in CORS origins if not already present
if settings.FRONTEND_URL and settings.FRONTEND_URL not in settings.BACKEND_CORS_ORIGINS:
    settings.BACKEND_CORS_ORIGINS.append(settings.FRONTEND_URL)

