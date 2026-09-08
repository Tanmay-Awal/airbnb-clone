from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.review import Review
from app.models.booking import Booking
from app.models.listing import Listing
from app.schemas.review import ReviewCreate, ReviewOut, ReviewsListOut
from app.services.listing_service import get_listing_rating_stats
from app.services.booking_service import refresh_completed_bookings

def get_listing_reviews(db: Session, listing_id: int) -> ReviewsListOut:
    reviews = db.query(Review).options(
        joinedload(Review.user)
    ).filter(Review.listing_id == listing_id).order_by(Review.created_at.desc()).all()

    avg_rating, review_count = get_listing_rating_stats(db, listing_id)

    items = [
        ReviewOut(
            id=r.id,
            listing_id=r.listing_id,
            user_id=r.user_id,
            booking_id=r.booking_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            user=r.user
        )
        for r in reviews
    ]

    return ReviewsListOut(
        items=items,
        average_rating=avg_rating,
        review_count=review_count
    )

def create_review(db: Session, user_id: int, listing_id: int, data: ReviewCreate) -> ReviewOut:
    # 1. Listing exists check
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found."
        )

    # 2. Booking exists check
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    # 3. Ownership & Listing verification
    if booking.guest_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review your own stay."
        )

    if booking.listing_id != listing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking does not match this listing."
        )

    # 4. Stay must be COMPLETED
    if booking.status.upper() != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only review a property after completing your stay."
        )

    # 5. Duplicate review check
    existing_review = db.query(Review).filter(Review.booking_id == data.booking_id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this booking."
        )

    review = Review(
        listing_id=listing_id,
        user_id=user_id,
        booking_id=data.booking_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewOut.model_validate(review)
