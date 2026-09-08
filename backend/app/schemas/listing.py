from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import UserOut

class AmenityOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ListingImageBase(BaseModel):
    url: str
    position: int = 0

class ListingImageCreate(ListingImageBase):
    pass

class ListingImageOut(ListingImageBase):
    id: int

    class Config:
        from_attributes = True

class ListingBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    privacy_type: Optional[str] = None
    location: Optional[str] = None
    price_per_night: Optional[int] = None
    max_guests: Optional[int] = 4
    bedrooms: Optional[int] = 1
    beds: Optional[int] = 1
    bathrooms: Optional[int] = 1
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ListingDraftCreate(BaseModel):
    id: Optional[int] = None
    # status is server-controlled only — never accepted from the client
    property_type: Optional[str] = None
    privacy_type: Optional[str] = None
    
    # Address details
    flat_house_no: Optional[str] = None
    street_address: Optional[str] = None
    landmark: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = "India"
    location: Optional[str] = None
    
    # Basics & Amenities
    max_guests: Optional[int] = 4
    bedrooms: Optional[int] = 1
    beds: Optional[int] = 1
    bathrooms: Optional[int] = 1
    amenities: Optional[List[str]] = []
    
    # Details & Pricing
    title: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[str] = None
    price_per_night: Optional[int] = 1511
    weekend_price_percent: Optional[int] = 10
    weekly_discount_percent: Optional[int] = 10
    monthly_discount_percent: Optional[int] = 20
    min_nights: Optional[int] = 1
    max_nights: Optional[int] = 365
    cancellation_policy_short: Optional[str] = "Flexible"
    cancellation_policy_long: Optional[str] = "Firm Long-Term"
    booking_mode: Optional[str] = "APPROVE_FIRST_3"
    discounts: Optional[str] = None
    safety_details: Optional[str] = None
    residential_address: Optional[str] = None
    is_business_host: Optional[bool] = False
    images: Optional[List[str]] = []

class HostSettingsUpdate(BaseModel):
    listing_id: Optional[int] = None
    price_per_night: Optional[int] = None
    weekend_price_percent: Optional[int] = None
    weekly_discount_percent: Optional[int] = None
    monthly_discount_percent: Optional[int] = None
    min_nights: Optional[int] = None
    max_nights: Optional[int] = None
    cancellation_policy_short: Optional[str] = None
    cancellation_policy_long: Optional[str] = None

class ListingCreate(ListingBase):
    amenity_ids: List[int] = []
    images: List[ListingImageCreate] = []

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    privacy_type: Optional[str] = None
    location: Optional[str] = None
    price_per_night: Optional[int] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenity_ids: Optional[List[int]] = None
    images: Optional[List[ListingImageCreate]] = None

class ListingCardOut(BaseModel):
    id: int
    title: str = "Untitled listing"
    location: str = "Draft location"
    property_type: str = "Home"
    price_per_night: int = 0
    weekend_price_percent: int = 10
    weekly_discount_percent: int = 10
    monthly_discount_percent: int = 20
    min_nights: int = 1
    max_nights: int = 365
    cancellation_policy_short: str = "Flexible"
    cancellation_policy_long: str = "Firm Long-Term"
    max_guests: int = 1
    bedrooms: int = 1
    beds: int = 1
    bathrooms: int = 1
    status: str = "PUBLISHED"
    is_published: bool = True
    cover_image: Optional[str] = None
    images: List[str] = []
    amenities: List[str] = []
    rating: float = 0.0
    review_count: int = 0
    host_name: str = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ListingDetailOut(ListingBase):
    id: int
    host_id: int
    status: str = "PUBLISHED"
    is_published: bool = True
    flat_house_no: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = "India"
    weekend_price_percent: Optional[int] = 10
    weekly_discount_percent: Optional[int] = 10
    monthly_discount_percent: Optional[int] = 20
    min_nights: Optional[int] = 1
    max_nights: Optional[int] = 365
    cancellation_policy_short: Optional[str] = "Flexible"
    cancellation_policy_long: Optional[str] = "Firm Long-Term"
    booking_mode: Optional[str] = "APPROVE_FIRST_3"
    discounts: Optional[str] = None
    highlights: Optional[str] = None
    safety_details: Optional[str] = None
    residential_address: Optional[str] = None
    is_business_host: Optional[bool] = False
    host: UserOut
    images: List[ListingImageOut] = []
    amenities: List[AmenityOut] = []
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedListingsOut(BaseModel):
    items: List[ListingCardOut]
    page: int
    limit: int
    total: int
    has_next: bool
