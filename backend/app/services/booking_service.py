from datetime import date
from typing import List

from fastapi import HTTPException
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.booking import Booking
from app.models.listing import Listing
from app.schemas.booking import AvailabilityResponse, BookingCreate, BookingOut, GuestSummary, ListingSummary, PriceBreakdown
from app.services.pricing_service import calculate_price_breakdown


def _overlap_exists(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    return db.query(Booking.id).filter(
        Booking.listing_id == listing_id, Booking.status == "CONFIRMED",
        Booking.check_in < check_out, Booking.check_out > check_in,
    ).first() is not None


def _snapshot_breakdown(booking: Booking) -> PriceBreakdown:
    nights = (booking.check_out - booking.check_in).days
    return PriceBreakdown(nights=nights, price_per_night=booking.price_per_night,
        base_price=booking.price_per_night * nights, cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee, total_price=booking.total_price)


def _to_booking_out(booking: Booking, include_guest: bool = False) -> BookingOut:
    listing = booking.listing
    cover_image = listing.images[0].url if listing and listing.images else None
    return BookingOut(
        id=booking.id, listing_id=booking.listing_id, guest_id=booking.guest_id,
        check_in=booking.check_in, check_out=booking.check_out, guests=booking.guests,
        status=booking.status, total_price=booking.total_price, created_at=booking.created_at,
        listing=ListingSummary(id=listing.id, title=listing.title, location=listing.location,
            property_type=listing.property_type, cover_image=cover_image,
            price_per_night=booking.price_per_night) if listing else None,
        guest=GuestSummary.model_validate(booking.guest) if include_guest and booking.guest else None,
        price_breakdown=_snapshot_breakdown(booking),
    )


def refresh_completed_bookings(db: Session) -> None:
    """Advance stays after checkout; cancellation is a terminal state."""
    db.query(Booking).filter(Booking.status == "CONFIRMED", Booking.check_out < date.today()).update(
        {Booking.status: "COMPLETED"}, synchronize_session=False)


def check_availability(db: Session, listing_id: int, check_in: date, check_out: date) -> AvailabilityResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id, Listing.is_active.is_(True)).first()
    if not listing:
        return AvailabilityResponse(available=False, reason="Listing not found or no longer available")
    if check_in >= check_out:
        return AvailabilityResponse(available=False, reason="Check-out date must be after check-in date")
    if check_in < date.today():
        return AvailabilityResponse(available=False, reason="Check-in date cannot be in the past")
    if _overlap_exists(db, listing_id, check_in, check_out):
        return AvailabilityResponse(available=False, reason="Property is no longer available for the selected dates.")
    return AvailabilityResponse(available=True, price_breakdown=calculate_price_breakdown(
        listing.price_per_night, check_in, check_out))


def create_booking(db: Session, guest_id: int, data: BookingCreate) -> BookingOut:
    if data.check_in >= data.check_out:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date.")
    if data.check_in < date.today():
        raise HTTPException(status_code=400, detail="Check-in date cannot be in the past.")
    try:
        # SQLite cannot lock a missing availability row. An immediate transaction serializes
        # writers, so the final overlap check and insert are one atomic decision.
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        listing = db.query(Listing).options(selectinload(Listing.images)).filter(
            Listing.id == data.listing_id, Listing.is_active.is_(True)).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found or no longer available.")
        if data.guests > listing.max_guests:
            raise HTTPException(status_code=400, detail=(
                f"This property can accommodate a maximum of {listing.max_guests} guests."))
        if _overlap_exists(db, listing.id, data.check_in, data.check_out):
            raise HTTPException(status_code=409, detail="Property is no longer available for the selected dates.")
        quote = calculate_price_breakdown(listing.price_per_night, data.check_in, data.check_out)
        booking = Booking(listing_id=listing.id, guest_id=guest_id, check_in=data.check_in,
            check_out=data.check_out, guests=data.guests, status="CONFIRMED",
            total_price=quote.total_price, price_per_night=quote.price_per_night,
            cleaning_fee=quote.cleaning_fee, service_fee=quote.service_fee)
        db.add(booking)
        db.commit()
        db.refresh(booking)
        booking.listing = listing
        return _to_booking_out(booking)
    except HTTPException:
        db.rollback()
        raise
    except OperationalError as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="Booking system is busy. Please retry.") from exc


def get_guest_bookings(db: Session, guest_id: int) -> List[BookingOut]:
    refresh_completed_bookings(db)
    bookings = db.query(Booking).options(joinedload(Booking.listing).selectinload(Listing.images)).filter(
        Booking.guest_id == guest_id).order_by(Booking.check_in.desc()).all()
    return [_to_booking_out(booking) for booking in bookings]


def get_booking(db: Session, booking_id: int, user_id: int) -> BookingOut:
    booking = db.query(Booking).options(joinedload(Booking.listing).selectinload(Listing.images),
        joinedload(Booking.guest)).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.guest_id != user_id and booking.listing.host_id != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this booking.")
    return _to_booking_out(booking, include_guest=booking.listing.host_id == user_id)


def cancel_booking(db: Session, booking_id: int, user_id: int) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.guest_id != user_id:
        raise HTTPException(status_code=403, detail="Only the guest who booked this stay can cancel it.")
    if booking.status != "CONFIRMED":
        raise HTTPException(status_code=409, detail="Only confirmed bookings can be cancelled.")
    if booking.check_in <= date.today():
        raise HTTPException(status_code=409, detail="Bookings cannot be cancelled on or after check-in.")
    booking.status = "CANCELLED"
    db.commit()
    db.refresh(booking)
    return booking
