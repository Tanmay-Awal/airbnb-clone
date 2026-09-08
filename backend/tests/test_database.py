import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import User, Listing, Booking, Review, Wishlist, Amenity, ListingImage

@pytest.fixture
def db_session():
    # In-memory SQLite for fast testing
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()

def test_user_creation_and_roles(db_session):
    host = User(name="Host User", email="host@test.com", role="HOST")
    guest = User(name="Guest User", email="guest@test.com", role="GUEST")
    db_session.add_all([host, guest])
    db_session.commit()

    assert host.id is not None
    assert guest.id is not None
    assert host.role == "HOST"
    assert guest.role == "GUEST"

def test_booking_overlap_logic(db_session):
    host = User(name="Host", email="host@test.com", role="HOST")
    guest1 = User(name="Guest1", email="g1@test.com", role="GUEST")
    guest2 = User(name="Guest2", email="g2@test.com", role="GUEST")
    db_session.add_all([host, guest1, guest2])
    db_session.commit()

    listing = Listing(
        host_id=host.id,
        title="Test Villa",
        description="A beautiful test villa.",
        property_type="Villa",
        location="Goa",
        price_per_night=5000,
        max_guests=4
    )
    db_session.add(listing)
    db_session.commit()

    # Existing booking: June 10 -> June 15
    existing_b = Booking(
        listing_id=listing.id,
        guest_id=guest1.id,
        check_in=date(2026, 6, 10),
        check_out=date(2026, 6, 15),
        guests=2,
        status="CONFIRMED",
        total_price=25000
    )
    db_session.add(existing_b)
    db_session.commit()

    # Adjacent booking: June 15 -> June 20 (MUST BE ALLOWED)
    adjacent_check_in = date(2026, 6, 15)
    adjacent_check_out = date(2026, 6, 20)
    overlap_count = db_session.query(Booking).filter(
        Booking.listing_id == listing.id,
        Booking.status != "CANCELLED",
        Booking.check_in < adjacent_check_out,
        Booking.check_out > adjacent_check_in
    ).count()

    assert overlap_count == 0, "Adjacent booking on checkout date should NOT overlap!"

    # Overlapping booking: June 14 -> June 18 (MUST CONFLICT)
    conflicting_check_in = date(2026, 6, 14)
    conflicting_check_out = date(2026, 6, 18)
    conflict_count = db_session.query(Booking).filter(
        Booking.listing_id == listing.id,
        Booking.status != "CANCELLED",
        Booking.check_in < conflicting_check_out,
        Booking.check_out > conflicting_check_in
    ).count()

    assert conflict_count == 1, "Overlapping dates must trigger a conflict!"
