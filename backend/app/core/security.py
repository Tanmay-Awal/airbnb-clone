"""
Authentication & Security Utilities.
- JWT token creation and verification
- Password hashing and verification via bcrypt
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext
from app.core.config import settings

logger = logging.getLogger(__name__)

# Password hashing with bcrypt
import bcrypt
if not hasattr(bcrypt, "__about__"):
    class _About:
        __version__ = getattr(bcrypt, "__version__", "4.2.1")
    bcrypt.__about__ = _About()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = getattr(settings, "SECRET_KEY", os.environ.get("SECRET_KEY", "CHANGE-ME-IN-PRODUCTION-USE-RANDOM-SECRET"))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, email: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None
