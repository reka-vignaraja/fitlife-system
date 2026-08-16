from datetime import datetime, timedelta
import random
import hashlib
import secrets
import hmac

from fastapi import APIRouter, HTTPException
from jose import jwt

from app.core.config import settings
from app.database.mongodb import get_database
from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    VerifyEmailRequest,
    ResendOTPRequest,
)
from app.services.auth_service import send_otp_email


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


def clean_email(email: str):
    return email.strip().lower()


def generate_otp():
    return str(random.randint(100000, 999999))


def hash_password(password: str):
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()

    return f"{salt}${password_hash}"


def verify_password(plain_password: str, stored_password: str):
    try:
        salt, saved_hash = stored_password.split("$")

        new_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        ).hex()

        return hmac.compare_digest(new_hash, saved_hash)
    except Exception:
        return False


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return token


def send_otp_safely(email: str, otp: str):
    try:
        send_otp_email(email, otp)
        print("OTP email sent successfully to:", email)
    except Exception as e:
        print("EMAIL SEND ERROR:", str(e))
        print("DEVELOPMENT OTP:", otp)
        return


@router.post("/register")
def register_user(data: RegisterRequest):
    db = get_database()
    users_collection = db["users"]

    email = clean_email(data.email)

    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Invalid email address",
        )

    existing_user = users_collection.find_one({"email": email})

    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(
        minutes=int(settings.OTP_EXPIRE_MINUTES)
    )

    if existing_user:
        if existing_user.get("is_verified") is True:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "name": data.name.strip(),
                    "password": hash_password(data.password),
                    "email_otp": otp,
                    "otp_expiry": otp_expiry,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        send_otp_safely(email, otp)

        return {
            "message": "Account already exists but not verified. New OTP sent.",
            "email": email,
            "is_verified": False,
        }

    new_user = {
        "name": data.name.strip(),
        "email": email,
        "password": hash_password(data.password),
        "role": "user",
        "is_verified": False,
        "email_otp": otp,
        "otp_expiry": otp_expiry,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = users_collection.insert_one(new_user)

    send_otp_safely(email, otp)

    return {
        "message": "Registration successful. OTP sent to your email.",
        "user_id": str(result.inserted_id),
        "email": email,
        "is_verified": False,
    }


@router.post("/verify-email")
def verify_email(data: VerifyEmailRequest):
    db = get_database()
    users_collection = db["users"]

    email = clean_email(data.email)

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.get("is_verified") is True:
        return {
            "message": "Email already verified. You can login now.",
            "email": email,
            "is_verified": True,
        }

    saved_otp = user.get("email_otp")
    otp_expiry = user.get("otp_expiry")

    if not saved_otp or not otp_expiry:
        raise HTTPException(
            status_code=400,
            detail="OTP not found. Please resend OTP.",
        )

    if datetime.utcnow() > otp_expiry:
        raise HTTPException(
            status_code=400,
            detail="OTP expired. Please resend OTP.",
        )

    if data.otp.strip() != saved_otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP",
        )

    users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "is_verified": True,
                "updated_at": datetime.utcnow(),
            },
            "$unset": {
                "email_otp": "",
                "otp_expiry": "",
            },
        },
    )

    return {
        "message": "Email verified successfully. You can login now.",
        "email": email,
        "is_verified": True,
    }


@router.post("/resend-otp")
def resend_otp(data: ResendOTPRequest):
    db = get_database()
    users_collection = db["users"]

    email = clean_email(data.email)

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.get("is_verified") is True:
        raise HTTPException(
            status_code=400,
            detail="Email already verified",
        )

    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(
        minutes=int(settings.OTP_EXPIRE_MINUTES)
    )

    users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "email_otp": otp,
                "otp_expiry": otp_expiry,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    send_otp_safely(email, otp)

    return {
        "message": "New OTP sent.",
        "email": email,
    }


@router.post("/login")
def login_user(data: LoginRequest):
    db = get_database()
    users_collection = db["users"]

    email = clean_email(data.email)

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if user.get("is_verified") is not True:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before login",
        )

    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user"),
        }
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
        },
    }