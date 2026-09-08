from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True)
    guest_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    check_in = Column(Date, nullable=False, index=True)
    check_out = Column(Date, nullable=False, index=True)
    guests = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="CONFIRMED")  # CONFIRMED, CANCELLED, COMPLETED
    total_price = Column(Integer, nullable=False)
    # Immutable monetary snapshot: future listing-price changes must not rewrite history.
    price_per_night = Column(Integer, nullable=False, default=0)
    cleaning_fee = Column(Integer, nullable=False, default=0)
    service_fee = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)

    __table_args__ = (
        Index("ix_bookings_availability", "listing_id", "status", "check_in", "check_out"),
        CheckConstraint("check_in < check_out", name="ck_booking_date_range"),
        CheckConstraint("guests > 0", name="ck_booking_positive_guests"),
        CheckConstraint("status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')", name="ck_booking_status"),
        CheckConstraint("total_price >= 0 AND price_per_night >= 0 AND cleaning_fee >= 0 AND service_fee >= 0", name="ck_booking_nonnegative_money"),
    )
