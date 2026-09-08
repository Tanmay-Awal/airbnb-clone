from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserOut

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3)

class ReviewOut(BaseModel):
    id: int
    listing_id: int
    user_id: int
    booking_id: int
    rating: int
    comment: str
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True

class ReviewsListOut(BaseModel):
    items: list[ReviewOut]
    average_rating: float
    review_count: int
