import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models import User, Listing, Booking, Review, Wishlist, Amenity

# Static test database file for test suite run
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_airbnb.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test users
    host = User(id=1, name="Sarah Host", email="sarah@test.com", role="HOST")
    guest = User(id=2, name="Alex Guest", email="alex@test.com", role="GUEST")
    db.add_all([host, guest])
    db.commit()

    # Create test amenities
    wifi = Amenity(id=1, name="WiFi")
    pool = Amenity(id=2, name="Pool")
    db.add_all([wifi, pool])
    db.commit()

    # Create test listing
    listing = Listing(
        id=1,
        host_id=1,
        title="Goa Luxury Villa",
        description="A beautiful test villa near Candolim.",
        property_type="Villa",
        location="Candolim, Goa",
        price_per_night=10000,
        max_guests=6,
        bedrooms=3,
        beds=4,
        bathrooms=3,
        status="PUBLISHED"
    )
    db.add(listing)
    db.commit()

    yield

    db.close()
    Base.metadata.drop_all(bind=engine)

from app.core.security import create_access_token

client = TestClient(app)

def get_auth_header(user_id: int, email: str, role: str):
    token = create_access_token(user_id, email, role)
    return {"Authorization": f"Bearer {token}"}

def test_auth_me_endpoint():
    res = client.get("/api/me", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Alex Guest"
    assert data["role"] == "GUEST"

def test_listings_search_and_pagination():
    res = client.get("/api/listings?location=Goa&page=1&limit=12")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    assert data["items"][0]["title"] == "Goa Luxury Villa"

def test_listing_detail():
    res = client.get("/api/listings/1")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Goa Luxury Villa"
    assert data["host"]["name"] == "Sarah Host"

def test_booking_creation_and_price_calculation():
    today = date.today()
    check_in = today + timedelta(days=10)
    check_out = today + timedelta(days=15)

    payload = {
        "listing_id": 1,
        "check_in": str(check_in),
        "check_out": str(check_out),
        "guests": 4
    }

    res = client.post("/api/bookings", json=payload, headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "CONFIRMED"
    assert data["price_breakdown"]["base_price"] == 50000
    assert data["price_breakdown"]["total_price"] == 56500

def test_booking_overlap_conflict():
    today = date.today()
    check_in = today + timedelta(days=10)
    check_out = today + timedelta(days=15)

    # Overlapping booking attempt (June 14 -> June 18) MUST fail with 409 Conflict
    overlap_res = client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(check_in + timedelta(days=2)),
        "check_out": str(check_out + timedelta(days=2)),
        "guests": 2
    }, headers=get_auth_header(2, "alex@test.com", "GUEST"))

    assert overlap_res.status_code == 409
    assert "no longer available" in overlap_res.json()["detail"]

def test_booking_detail_is_authorized_and_price_is_snapshot():
    booking_res = client.get("/api/bookings/1", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert booking_res.status_code == 200
    booking = booking_res.json()
    assert booking["price_breakdown"]["total_price"] == booking["total_price"]

    forbidden_res = client.get("/api/bookings/1", headers={"Authorization": "Bearer invalid_token_here"})
    assert forbidden_res.status_code == 401

def test_booking_cancellation_state_rules():
    today = date.today()
    future = Booking(
        listing_id=1, guest_id=2, check_in=today + timedelta(days=30),
        check_out=today + timedelta(days=32), guests=2, status="CONFIRMED",
        total_price=23500, price_per_night=10000, cleaning_fee=1500, service_fee=2000,
    )
    db = TestingSessionLocal()
    db.add(future)
    db.commit()
    db.refresh(future)
    booking_id = future.id
    db.close()

    cancelled = client.post(f"/api/bookings/{booking_id}/cancel", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert cancelled.status_code == 200
    again = client.post(f"/api/bookings/{booking_id}/cancel", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert again.status_code == 409

def test_host_authorization_restriction():
    payload = {
        "title": "Unauthorized Villa",
        "description": "Guest trying to create a listing",
        "property_type": "House",
        "location": "Delhi",
        "price_per_night": 3000,
        "max_guests": 2
    }
    res = client.post("/api/listings", json=payload, headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert res.status_code == 403

    host_res = client.post("/api/listings", json=payload, headers=get_auth_header(1, "sarah@test.com", "HOST"))
    assert host_res.status_code == 201
    assert host_res.json()["title"] == "Unauthorized Villa"

def test_listing_retires_without_destroying_booking_history():
    res = client.delete("/api/listings/1", headers=get_auth_header(1, "sarah@test.com", "HOST"))
    assert res.status_code == 204
    assert client.get("/api/listings/1").status_code == 404
    db = TestingSessionLocal()
    assert db.query(Listing).filter(Listing.id == 1).first().is_active is False
    assert db.query(Booking).filter(Booking.listing_id == 1).count() >= 1
    db.close()

def test_wishlist_flow():
    res = client.post("/api/wishlist/1", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert res.status_code == 201

    dup = client.post("/api/wishlist/1", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert dup.status_code == 409

    get_res = client.get("/api/wishlist", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert get_res.status_code == 200
    assert len(get_res.json()) >= 1

    del_res = client.delete("/api/wishlist/1", headers=get_auth_header(2, "alex@test.com", "GUEST"))
    assert del_res.status_code == 204
