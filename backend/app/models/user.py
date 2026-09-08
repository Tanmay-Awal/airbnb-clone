from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False, default="GUEST")  # GUEST or HOST
    avatar_url = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # bcrypt hash; nullable for legacy/demo users
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    listings = relationship("Listing", back_populates="host", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="guest")
    reviews = relationship("Review", back_populates="user")
    wishlists = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")
