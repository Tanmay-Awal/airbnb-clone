from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "GUEST"
    avatar_url: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DemoLoginRequest(BaseModel):
    user_id: int

class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "GUEST"
