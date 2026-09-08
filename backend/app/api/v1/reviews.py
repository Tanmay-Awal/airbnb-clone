from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, ReviewsListOut
from app.services import review_service

router = APIRouter(prefix="", tags=["Reviews"])

@router.get("/listings/{listing_id}/reviews", response_model=ReviewsListOut)
def get_listing_reviews(listing_id: int, db: Session = Depends(get_db)):
    """Retrieve public reviews for a specific property listing."""
    return review_service.get_listing_reviews(db, listing_id)

@router.post("/listings/{listing_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_listing_review(
    listing_id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post a review for a completed booking stay."""
    return review_service.create_review(db, current_user.id, listing_id, data)
