from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    listing = relationship("Listing", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")

    __table_args__ = (
        UniqueConstraint("booking_id", name="uq_review_booking"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),
    )
