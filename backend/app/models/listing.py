from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, Table, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class ListingAmenity(Base):
    __tablename__ = "listing_amenities"

    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        UniqueConstraint("listing_id", "amenity_id", name="uq_listing_amenity"),
    )

class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Relationships
    listings = relationship("Listing", secondary="listing_amenities", back_populates="amenities")

class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String, nullable=False)
    position = Column(Integer, default=0, nullable=False)

    # Relationship
    listing = relationship("Listing", back_populates="images")

class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Onboarding & Status
    status = Column(String, default="DRAFT", nullable=False, index=True)  # DRAFT, PUBLISHED, UNPUBLISHED
    is_published = Column(Boolean, default=False, nullable=False, index=True)
    
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    property_type = Column(String, nullable=True, index=True)  # House, Flat/apartment, Cabin, etc.
    privacy_type = Column(String, nullable=True)  # An entire place, A room, A shared room
    location = Column(String, nullable=True, index=True)  # Candolim, Goa, etc.
    price_per_night = Column(Integer, nullable=True, index=True)  # INR
    max_guests = Column(Integer, nullable=True, default=4)
    bedrooms = Column(Integer, nullable=True, default=1)
    beds = Column(Integer, nullable=True, default=1)
    bathrooms = Column(Integer, nullable=True, default=1)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Detailed Address Fields
    flat_house_no = Column(String, nullable=True)
    street_address = Column(String, nullable=True)
    landmark = Column(String, nullable=True)
    locality = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    country = Column(String, default="India", nullable=True)

    # Step 2 & 3 Details
    weekend_price_percent = Column(Integer, default=10, nullable=True)
    weekly_discount_percent = Column(Integer, default=10, nullable=True)
    monthly_discount_percent = Column(Integer, default=20, nullable=True)
    min_nights = Column(Integer, default=1, nullable=True)
    max_nights = Column(Integer, default=365, nullable=True)
    cancellation_policy_short = Column(String, default="Flexible", nullable=True)
    cancellation_policy_long = Column(String, default="Firm Long-Term", nullable=True)
    booking_mode = Column(String, default="APPROVE_FIRST_3", nullable=True)
    discounts = Column(String, nullable=True)  # e.g., "NEW_LISTING:20,WEEKLY:10"
    highlights = Column(String, nullable=True)  # e.g., "Peaceful,Unique"
    safety_details = Column(String, nullable=True)  # e.g., "SECURITY_CAMERA,SMOKE_ALARM"
    residential_address = Column(Text, nullable=True)
    is_business_host = Column(Boolean, default=False, nullable=True)

    # Listings are retired instead of deleted so bookings and reviews remain auditable.
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    host = relationship("User", back_populates="listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.position")
    amenities = relationship("Amenity", secondary="listing_amenities", back_populates="listings")
    bookings = relationship("Booking", back_populates="listing")
    reviews = relationship("Review", back_populates="listing")
    wishlist_entries = relationship("Wishlist", back_populates="listing", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_listings_search", "location", "property_type", "price_per_night"),
        Index("ix_listings_host_active", "host_id", "is_active"),
    )
