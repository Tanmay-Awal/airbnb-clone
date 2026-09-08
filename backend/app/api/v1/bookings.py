from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a reservation with date overlap check and backend pricing calculation."""
    return booking_service.create_booking(db, current_user.id, data)

@router.get("", response_model=List[BookingOut])
def get_my_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all bookings/trips made by the current user."""
    return booking_service.get_guest_bookings(db, current_user.id)

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a booking only for its guest or the listing's host."""
    return booking_service.get_booking(db, booking_id, current_user.id)

@router.post("/{booking_id}/cancel", response_model=dict)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an active booking."""
    booking = booking_service.cancel_booking(db, booking_id, current_user.id)
    return {
        "id": booking.id,
        "status": booking.status,
        "message": "Booking cancelled successfully."
    }
