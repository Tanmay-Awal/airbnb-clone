import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.user import User

logger = logging.getLogger(__name__)

# Optional bearer token — does not reject requests without a token (allows demo header fallback)
optional_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    x_user_id: Optional[int] = Header(None, alias="X-User-Id"),
    x_demo_user_id: Optional[int] = Header(None, alias="X-Demo-User-Id"),
    db: Session = Depends(get_db)
) -> User:
    """
    Extract current user from:
    1. Authorization: Bearer <JWT> header (preferred, secure)
    2. X-User-Id / X-Demo-User-Id header (demo mode fallback only)
    
    Rejects missing or invalid user identity with 401 UNAUTHORIZED.
    """
    user_id: Optional[int] = None

    # Priority 1: JWT token authentication
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and "sub" in payload:
            user_id = int(payload["sub"])
            logger.info(f"[AUTH JWT] Authenticated user_id={user_id} from JWT token")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Priority 2: Demo header fallback (only in DEMO_MODE)
    if user_id is None and settings.DEMO_MODE:
        user_id = x_user_id if x_user_id is not None else x_demo_user_id
        if user_id is not None:
            logger.info(f"[AUTH DEMO] Using demo header authentication for user_id={user_id}")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a Bearer token or enable demo mode.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"[AUTH ERROR] User ID {user_id} not found in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User was not found.",
        )

    logger.info(f"[AUTH OK] Active User -> ID: {user.id} | Email: {user.email} | Role: {user.role}")
    return user


def get_current_host(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Enforce that the current user has HOST role.
    """
    if current_user.role.upper() != "HOST":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to hosts only."
        )
    return current_user
