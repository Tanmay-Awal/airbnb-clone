from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.wishlist import WishlistOut
from app.services import wishlist_service

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

@router.get("", response_model=List[WishlistOut])
def get_user_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve saved wishlist properties for current user."""
    return wishlist_service.get_user_wishlist(db, current_user.id)

@router.post("/{listing_id}", response_model=WishlistOut, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a property listing to user's wishlist."""
    return wishlist_service.add_to_wishlist(db, current_user.id, listing_id)

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a property listing from user's wishlist."""
    wishlist_service.remove_from_wishlist(db, current_user.id, listing_id)
    return None
