import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserOut, DemoLoginRequest, LoginRequest, SignUpRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Auth & Demo Persona"])

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently active user identity."""
    return current_user

@router.post("/auth/login")
def auth_login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password. Returns JWT access token."""
    email_clean = data.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        logger.info(f"[AUTH] Login failed: email '{email_clean}' not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email. Please sign up to create an account."
        )

    # If user has a password hash, verify it
    if user.password_hash:
        if not data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password is required."
            )
        if not verify_password(data.password, user.password_hash):
            logger.info(f"[AUTH] Login failed: incorrect password for '{email_clean}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password."
            )
    else:
        # Legacy/demo user without password — allow login but log a warning
        # In production (DEMO_MODE=False), this should require password
        if not settings.DEMO_MODE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password is required. Please reset your password."
            )
        logger.warning(f"[AUTH LEGACY] User '{email_clean}' logged in without password (demo/legacy mode)")

    # Issue JWT token
    token = create_access_token(user.id, user.email, user.role)
    logger.info(f"[AUTH OK] Login successful: user_id={user.id}, email={user.email}")

    return {
        "message": f"Logged in successfully as {user.name} ({user.role})",
        "user": UserOut.model_validate(user),
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/auth/signup")
def auth_signup(data: SignUpRequest, db: Session = Depends(get_db)):
    """Create a new user record with hashed password and return JWT token."""
    email_clean = data.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()

    if existing_user:
        logger.info(f"[AUTH] Signup duplicate: email '{email_clean}' already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead."
        )

    display_name = data.name.strip() if data.name and data.name.strip() else email_clean.split('@')[0].capitalize()
    role_val = data.role.strip().upper() if data.role and data.role.strip() else "GUEST"
    if role_val not in ["GUEST", "HOST"]:
        role_val = "GUEST"

    # Hash password if provided
    hashed_pw = None
    if data.password and data.password.strip():
        hashed_pw = hash_password(data.password.strip())

    user = User(
        name=display_name,
        email=email_clean,
        role=role_val,
        password_hash=hashed_pw,
        avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue JWT token
    token = create_access_token(user.id, user.email, user.role)
    logger.info(f"[AUTH OK] Signup successful: user_id={user.id}, email={user.email}")

    return {
        "message": f"Account created successfully! Welcome {user.name}.",
        "user": UserOut.model_validate(user),
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/users/demo", response_model=List[UserOut])
def get_demo_users(db: Session = Depends(get_db)):
    """Return list of seeded demo personas for switching in UI. Only available in DEMO_MODE."""
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo endpoints are disabled in production."
        )
    return db.query(User).limit(20).all()  # Cap at 20 to prevent unbounded query

@router.post("/demo/login")
def demo_login(data: DemoLoginRequest, db: Session = Depends(get_db)):
    """Simulate logging in as a demo user. Only available in DEMO_MODE."""
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo endpoints are disabled in production."
        )
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo user not found."
        )

    token = create_access_token(user.id, user.email, user.role)

    return {
        "message": f"Logged in successfully as {user.name} ({user.role})",
        "user": UserOut.model_validate(user),
        "access_token": token,
        "token_type": "bearer"
    }
