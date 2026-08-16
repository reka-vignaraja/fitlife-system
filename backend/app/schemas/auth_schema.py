from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: str
    password: str


class VerifyEmailRequest(BaseModel):
    email: str
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    email: str