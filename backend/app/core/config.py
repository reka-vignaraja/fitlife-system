import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "fitlife_db")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fitlife_secret_key_12345")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_EMAIL: str = os.getenv("SMTP_EMAIL", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "FitLife")
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))


settings = Settings()