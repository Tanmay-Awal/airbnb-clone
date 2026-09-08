# Airbnb Web App — Database Design

## 1. Purpose

This document defines the complete database design for the Airbnb-style full-stack application.

The database must support:

- Users
- Host profiles/ownership
- Property listings
- Listing images
- Amenities
- Bookings
- Reviews
- Wishlists
- Booking availability
- Host booking management

The database must preserve data integrity and enforce important business rules wherever possible.

---

# 2. Database Technology

The project will use:

```text
SQLite
SQLAlchemy
Alembic
```

SQLite is the only database used by this project.

No additional database is required.

---

# 3. Database Design Principles

The schema should follow these principles:

1. Normalize repeated data.
2. Use foreign keys for relationships.
3. Use database constraints where appropriate.
4. Use indexes for frequently queried fields.
5. Avoid storing derived data unnecessarily.
6. Keep booking records historically meaningful.
7. Keep business rules in the backend service layer while using DB constraints as an additional safety layer.
8. Design the schema so the frontend does not dictate database structure.

---

# 4. Entity Overview

The primary entities are:

```text
User
Listing
ListingImage
Amenity
Booking
Review
Wishlist
```

Relationships:

```text
                         ┌──────────────┐
                         │     USER     │
                         └──────┬───────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
               hosts          guests         reviews
                 │              │              │
                 ▼              ▼              ▼
          ┌─────────────┐  ┌───────────┐  ┌─────────┐
          │   LISTING   │  │  BOOKING  │  │ REVIEW  │
          └──────┬──────┘  └─────┬─────┘  └─────────┘
                 │               │
        ┌────────┼────────┐      │
        │        │        │      │
        ▼        ▼        ▼      │
     IMAGES   AMENITIES  BOOKINGS│
        │        │               │
        │        └───────────────┘
        │
        ▼
     WISHLIST
```

More precisely:

```text
User 1 ───── N Listing
User 1 ───── N Booking
User 1 ───── N Review
User 1 ───── N Wishlist

Listing 1 ───── N ListingImage
Listing N ───── N Amenity
Listing 1 ───── N Booking
Listing 1 ───── N Review
Listing 1 ───── N Wishlist

Booking 1 ───── 0..1 Review
```

---

# 5. `users`

Stores all users in the system.

A user can be either a guest or a host.

## Schema

```text
users
------------------------------------------------
id
name
email
role
avatar_url
created_at
```

## Columns

### `id`

```text
Type: INTEGER
Primary Key: Yes
Auto Increment: Yes
Nullable: No
```

Unique identifier for the user.

---

### `name`

```text
Type: VARCHAR
Nullable: No
```

User's display name.

---

### `email`

```text
Type: VARCHAR
Nullable: No
Unique: Yes
```

User's email address.

We should enforce uniqueness at the database level.

---

### `role`

```text
Type: VARCHAR
Nullable: No
Default: GUEST
```

Allowed values:

```text
GUEST
HOST
```

The backend should validate role values.

---

### `avatar_url`

```text
Type: VARCHAR
Nullable: Yes
```

URL of the user's profile image.

---

### `created_at`

```text
Type: DATETIME
Nullable: No
```

Timestamp when the user was created.

---

## Constraints

```text
PRIMARY KEY(id)
UNIQUE(email)
```

---

# 6. `listings`

Stores properties available for booking.

## Schema

```text
listings
------------------------------------------------
id
host_id
title
description
property_type
location
price_per_night
max_guests
bedrooms
beds
bathrooms
latitude
longitude
created_at
updated_at
```

---

## Columns

### `id`

```text
Type: INTEGER
Primary Key: Yes
Auto Increment: Yes
```

Unique listing identifier.

---

### `host_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: users.id
```

Identifies the host who owns the listing.

Relationship:

```text
users.id
     ↓
listings.host_id
```

One host can own multiple listings.

---

### `title`

```text
Type: VARCHAR
Nullable: No
```

Example:

```text
Beautiful Beachfront Villa
```

---

### `description`

```text
Type: TEXT
Nullable: No
```

Full property description.

---

### `property_type`

```text
Type: VARCHAR
Nullable: No
```

Examples:

```text
Apartment
House
Villa
Guesthouse
Hotel
Cabin
```

We should not hardcode the list into the database schema.

The backend can validate the currently supported values.

---

### `location`

```text
Type: VARCHAR
Nullable: No
Indexed: Yes
```

Human-readable location.

Examples:

```text
Candolim, Goa
South Delhi
Koramangala, Bengaluru
```

Location search will initially be text-based.

---

### `price_per_night`

```text
Type: INTEGER
Nullable: No
```

Price in INR per night.

For example:

```text
3500
```

Using an integer avoids floating-point currency calculations.

---

### `max_guests`

```text
Type: INTEGER
Nullable: No
```

Maximum number of guests supported.

Must be greater than zero.

---

### `bedrooms`

```text
Type: INTEGER
Nullable: No
```

Number of bedrooms.

---

### `beds`

```text
Type: INTEGER
Nullable: No
```

Number of beds.

---

### `bathrooms`

```text
Type: INTEGER
Nullable: No
```

Number of bathrooms.

---

### `latitude`

```text
Type: FLOAT
Nullable: Yes
```

Optional latitude.

This allows map functionality to be added later.

---

### `longitude`

```text
Type: FLOAT
Nullable: Yes
```

Optional longitude.

---

### `created_at`

```text
Type: DATETIME
Nullable: No
```

Creation timestamp.

---

### `updated_at`

```text
Type: DATETIME
Nullable: No
```

Last modification timestamp.

---

## Constraints

```text
PRIMARY KEY(id)

FOREIGN KEY(host_id)
REFERENCES users(id)

price_per_night > 0

max_guests > 0

bedrooms >= 0

beds >= 0

bathrooms >= 0
```

The numeric validation can be implemented at the application/schema level, with database constraints added where practical.

---

# 7. `listing_images`

A listing can have multiple images.

Images should NOT be stored directly as:

```text
listings.image_url
```

because a property needs a gallery.

Instead:

```text
Listing
   │
   ├── Image 1
   ├── Image 2
   ├── Image 3
   └── Image 4
```

## Schema

```text
listing_images
------------------------------------------------
id
listing_id
url
position
```

---

## Columns

### `id`

```text
Type: INTEGER
Primary Key: Yes
```

---

### `listing_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: listings.id
```

---

### `url`

```text
Type: VARCHAR
Nullable: No
```

Image URL.

For the assignment, externally hosted image URLs are acceptable.

---

### `position`

```text
Type: INTEGER
Nullable: No
Default: 0
```

Determines gallery ordering.

Example:

```text
position = 0 → cover image
position = 1 → second image
position = 2 → third image
```

---

## Constraints

```text
PRIMARY KEY(id)

FOREIGN KEY(listing_id)
REFERENCES listings(id)
```

---

# 8. `amenities`

Stores reusable amenities.

Instead of storing:

```text
listings.amenities = "WiFi,Pool,Kitchen"
```

we normalize them.

## Schema

```text
amenities
------------------------------------------------
id
name
```

Examples:

```text
1 | WiFi
2 | Kitchen
3 | Pool
4 | Parking
5 | Air conditioning
6 | TV
7 | Washing machine
8 | Workspace
```

---

## Constraints

```text
PRIMARY KEY(id)

UNIQUE(name)
```

An amenity should only exist once.

---

# 9. `listing_amenities`

This is the junction table for the many-to-many relationship between listings and amenities.

```text
Listing N ───── N Amenity
```

## Schema

```text
listing_amenities
------------------------------------------------
listing_id
amenity_id
```

---

## Example

Suppose:

```text
Listing 10
```

has:

```text
WiFi
Kitchen
Pool
Parking
```

The table might contain:

```text
listing_id | amenity_id
-----------|-----------
10         | 1
10         | 2
10         | 3
10         | 4
```

---

## Constraints

```text
FOREIGN KEY(listing_id)
REFERENCES listings(id)

FOREIGN KEY(amenity_id)
REFERENCES amenities(id)

UNIQUE(listing_id, amenity_id)
```

The unique constraint prevents:

```text
10 | 1
10 | 1
```

from appearing twice.

---

# 10. `bookings`

This is one of the most important tables.

It records reservations made by guests.

## Schema

```text
bookings
------------------------------------------------
id
listing_id
guest_id
check_in
check_out
guests
status
total_price
created_at
```

---

## Columns

### `id`

```text
Type: INTEGER
Primary Key: Yes
```

---

### `listing_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: listings.id
```

The property being booked.

---

### `guest_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: users.id
```

The user who made the booking.

---

### `check_in`

```text
Type: DATE
Nullable: No
```

Arrival date.

---

### `check_out`

```text
Type: DATE
Nullable: No
```

Departure date.

---

### `guests`

```text
Type: INTEGER
Nullable: No
```

Number of guests.

Must be:

```text
guests > 0
```

and:

```text
guests <= listing.max_guests
```

The second rule requires application-level validation because it depends on another table.

---

### `status`

```text
Type: VARCHAR
Nullable: No
Default: CONFIRMED
```

Supported statuses:

```text
CONFIRMED
CANCELLED
COMPLETED
```

---

### `total_price`

```text
Type: INTEGER
Nullable: No
```

Final booking amount in INR.

This value is calculated by the backend.

The frontend must never be trusted to provide the authoritative amount.

---

### `created_at`

```text
Type: DATETIME
Nullable: No
```

Booking creation timestamp.

---

# 11. Booking Date Rules

The following rules must be enforced by the backend.

## Rule 1 — Check-in before check-out

```text
check_in < check_out
```

Invalid:

```text
June 15 → June 15
June 16 → June 15
```

---

## Rule 2 — No past check-in

A new booking cannot start before the current date.

---

## Rule 3 — Positive number of guests

```text
guests > 0
```

---

## Rule 4 — Guest capacity

```text
guests <= listing.max_guests
```

---

# 12. Booking Overlap Logic

This is a critical business rule.

A new booking conflicts with an existing active booking when:

```text
existing.check_in < requested.check_out
AND
existing.check_out > requested.check_in
```

In SQLAlchemy-style logic:

```text
existing.check_in < requested_check_out
AND
existing.check_out > requested_check_in
```

Only active bookings should be considered.

For example:

```text
Existing:
June 10 → June 15

Requested:
June 14 → June 20
```

Conflict:

```text
June 10 < June 20  ✓
June 15 > June 14  ✓
```

Therefore reject.

---

## Adjacent bookings

These are allowed:

```text
Existing:
June 10 → June 15

Requested:
June 15 → June 20
```

Because:

```text
June 10 < June 20 ✓
June 15 > June 15 ✗
```

No overlap exists.

---

# 13. Cancelled Bookings

Cancelled bookings should NOT block availability.

Example:

```text
Booking A
June 10 → June 15
status = CANCELLED
```

Another user should be able to book:

```text
June 10 → June 15
```

after cancellation.

Therefore availability queries should only consider relevant active statuses.

---

# 14. Booking Transaction

Booking creation must happen inside a database transaction.

Conceptually:

```text
BEGIN

    Find listing

    Validate guest count

    Validate dates

    Check overlapping bookings

    Calculate number of nights

    Calculate total price

    Insert booking

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

This prevents partial state.

---

# 15. Price Calculation

The booking table stores the final calculated price.

The backend should calculate:

```text
nights =
    check_out - check_in
```

Then:

```text
base_price =
    listing.price_per_night × nights
```

Then add applicable fees.

For example:

```text
cleaning_fee
service_fee
```

The exact fee model can be defined during implementation.

The final value is stored in:

```text
bookings.total_price
```

This preserves the historical booking price.

This is important because listing prices may change later.

Example:

```text
2026 booking:
₹5,000/night
```

Later the host changes:

```text
₹7,000/night
```

The historical booking must still show the original total.

---

# 16. `reviews`

Stores guest reviews for properties.

## Schema

```text
reviews
------------------------------------------------
id
listing_id
user_id
booking_id
rating
comment
created_at
```

---

## Columns

### `id`

```text
Type: INTEGER
Primary Key: Yes
```

---

### `listing_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: listings.id
```

---

### `user_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: users.id
```

User who wrote the review.

---

### `booking_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: bookings.id
```

Booking associated with the review.

This allows the backend to verify that the user actually booked the property.

---

### `rating`

```text
Type: INTEGER
Nullable: No
```

Allowed:

```text
1
2
3
4
5
```

---

### `comment`

```text
Type: TEXT
Nullable: No
```

Review content.

---

### `created_at`

```text
Type: DATETIME
Nullable: No
```

---

# 17. Review Constraints

Rating must satisfy:

```text
1 <= rating <= 5
```

A user should only review their own booking.

Conceptually:

```text
booking.guest_id == current_user.id
```

The booking should also:

```text
booking.listing_id == requested_listing_id
```

The booking should be completed before review submission.

---

## One Review Per Booking

A booking should normally have at most one review.

Therefore:

```text
UNIQUE(booking_id)
```

should be enforced.

This prevents:

```text
Booking 101 → Review 1
Booking 101 → Review 2
```

---

# 18. `wishlists`

Stores properties saved by users.

## Schema

```text
wishlists
------------------------------------------------
id
user_id
listing_id
created_at
```

---

## Columns

### `id`

```text
Type: INTEGER
Primary Key: Yes
```

---

### `user_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: users.id
```

---

### `listing_id`

```text
Type: INTEGER
Nullable: No
Foreign Key: listings.id
```

---

### `created_at`

```text
Type: DATETIME
Nullable: No
```

---

# 19. Wishlist Constraints

A user cannot save the same property twice.

Therefore:

```text
UNIQUE(user_id, listing_id)
```

Example:

```text
user_id | listing_id
--------|-----------
1       | 10
```

A second insertion of:

```text
1 | 10
```

must be rejected or handled idempotently by the API.

---

# 20. Foreign Key Relationships

Complete relationship list:

```text
users.id
    ↓
listings.host_id

users.id
    ↓
bookings.guest_id

users.id
    ↓
reviews.user_id

users.id
    ↓
wishlists.user_id

listings.id
    ↓
listing_images.listing_id

listings.id
    ↓
bookings.listing_id

listings.id
    ↓
reviews.listing_id

listings.id
    ↓
wishlists.listing_id

listings.id
    ↓
listing_amenities.listing_id

amenities.id
    ↓
listing_amenities.amenity_id

bookings.id
    ↓
reviews.booking_id
```

---

# 21. Delete Behavior

We must be careful with cascading deletes.

## Listing → Images

Deleting a listing should remove its associated images.

```text
Listing deleted
      ↓
Listing images deleted
```

---

## Listing → Amenities

The listing's junction-table entries should be removed.

The actual `amenities` should NOT be deleted.

Example:

```text
Listing 10 ── WiFi
```

Deleting Listing 10 should not delete:

```text
WiFi
```

because other listings may use it.

---

## Listing → Bookings

Historical booking information should not be casually destroyed.

Prefer preventing deletion of a listing with important historical bookings, or use a soft-delete/archive strategy if required during implementation.

The exact approach should preserve booking history.

---

## User → Bookings / Reviews

User deletion should not casually destroy historical transaction records.

For this assignment, user deletion is not a required feature.

---

# 22. Indexes

Indexes should support the application's actual query patterns.

## Users

```text
users.email
```

Unique index created by the unique constraint.

---

## Listings

Recommended:

```text
listings.host_id
listings.location
listings.property_type
listings.price_per_night
```

These support:

- Host listing queries
- Location filtering
- Property type filtering
- Price filtering

---

## Bookings

Recommended:

```text
bookings.listing_id
bookings.guest_id
bookings.check_in
bookings.check_out
bookings.status
```

These support:

- Listing availability
- User trips
- Host bookings
- Date overlap queries

---

## Reviews

```text
reviews.listing_id
reviews.user_id
reviews.booking_id
```

---

## Wishlists

```text
wishlists.user_id
wishlists.listing_id
```

The unique constraint on:

```text
(user_id, listing_id)
```

also provides an index useful for duplicate checks.

---

# 23. Search Query Considerations

The main listing search will query:

```text
location
price_per_night
property_type
max_guests
```

and potentially:

```text
amenities
```

Dates require a booking availability query.

Conceptually:

```text
Find listings
WHERE
    listing matches filters
AND
    listing.max_guests >= requested_guests
AND
    listing does not have overlapping active booking
```

Pagination must be applied.

We should never retrieve every listing just to filter it in the frontend.

---

# 24. Availability Query

For requested:

```text
listing_id
check_in
check_out
```

we find overlapping bookings:

```text
SELECT bookings
WHERE
    listing_id = requested_listing
AND
    status != CANCELLED
AND
    check_in < requested_check_out
AND
    check_out > requested_check_in
```

If any result exists:

```text
NOT AVAILABLE
```

Otherwise:

```text
AVAILABLE
```

---

# 25. Listing Rating

The database does not need to store a manually updated rating on the listing initially.

Instead, rating can be calculated from reviews:

```text
average_rating =
    SUM(review.rating) / COUNT(review.id)
```

This avoids duplicated source-of-truth data.

The API can return:

```text
average_rating
review_count
```

as derived values.

If performance later becomes an issue, denormalization can be considered, but it is not necessary for this assignment.

---

# 26. Listing Card Data

The frontend listing card may need:

```text
id
title
location
price_per_night
cover_image
average_rating
review_count
property_type
```

Not every database table needs to be sent separately.

The backend can construct an appropriate response DTO/schema.

---

# 27. Listing Detail Data

The listing detail endpoint should return something conceptually like:

```json
{
  "id": 1,
  "title": "Beachfront Villa",
  "description": "...",
  "location": "Goa",
  "property_type": "Villa",
  "price_per_night": 5000,
  "max_guests": 6,
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 2,
  "images": [],
  "amenities": [],
  "host": {},
  "rating": 4.8,
  "review_count": 42,
  "reviews": []
}
```

The exact API response will be defined in `API_DESIGN.md`.

---

# 28. Seed Data Strategy

The project should include a repeatable seed script.

Example:

```text
backend/
└── seed/
    └── seed.py
```

Running the seed should create:

### Users

At least:

```text
3–5 hosts
5–10 guests
```

---

### Listings

At least:

```text
20–30 listings
```

Listings should vary by:

- Location
- Price
- Property type
- Guest capacity
- Amenities
- Bedrooms
- Beds
- Bathrooms
- Images

---

### Amenities

Seed common amenities:

```text
WiFi
Kitchen
Pool
Parking
Air conditioning
TV
Washing machine
Workspace
Heating
Breakfast
```

---

### Bookings

Create several bookings across different properties.

Include:

- Past bookings
- Upcoming bookings
- Cancelled booking

This makes availability and Trips functionality demonstrable.

---

### Reviews

Seed reviews for several completed bookings.

Ratings should vary naturally.

Example:

```text
5
5
4
4
3
```

rather than making every property 5.0.

---

# 29. Example Seed Dataset

Conceptually:

```text
USERS
------------------------------------------------
1 | Rahul      | rahul@example.com      | HOST
2 | Priya      | priya@example.com      | HOST
3 | Arjun      | arjun@example.com      | HOST
4 | Tanmay     | tanmay@example.com     | GUEST
5 | Ananya     | ananya@example.com     | GUEST
```

Listings:

```text
LISTINGS
------------------------------------------------
1 | Goa Beach Villa       | HOST 1
2 | Delhi Apartment       | HOST 1
3 | Manali Cabin          | HOST 2
4 | Mumbai Sea View       | HOST 2
5 | Jaipur Haveli         | HOST 3
```

Amenities:

```text
AMENITIES
------------------------------------------------
1 | WiFi
2 | Kitchen
3 | Pool
4 | Parking
5 | Air conditioning
```

Listing amenities:

```text
LISTING 1
→ WiFi
→ Pool
→ Parking
→ Air conditioning
```

---

# 30. SQLAlchemy Model Mapping

The database should map approximately to these models:

```text
User
Listing
ListingImage
Amenity
Booking
Review
Wishlist
```

Relationships should be explicitly represented.

Conceptually:

```python
User
 ├── listings
 ├── bookings
 ├── reviews
 └── wishlists

Listing
 ├── host
 ├── images
 ├── amenities
 ├── bookings
 ├── reviews
 └── wishlist_entries

Booking
 ├── listing
 ├── guest
 └── review

Review
 ├── listing
 ├── user
 └── booking
```

The exact SQLAlchemy implementation will be handled in the backend implementation phase.

---

# 31. Database Migration Strategy

Use Alembic for schema changes.

Initial migration should create:

```text
users
listings
listing_images
amenities
listing_amenities
bookings
reviews
wishlists
```

Future schema changes should be represented through migrations rather than manually editing the SQLite database.

Example:

```text
alembic revision --autogenerate
alembic upgrade head
```

The migration history should be committed to Git.

---

# 32. Data Integrity Rules

The following rules are considered critical:

```text
User email must be unique.

Listing must belong to a valid host.

Booking must reference a valid listing.

Booking must reference a valid guest.

Booking check-in must be before check-out.

Booking guests must be > 0.

Booking guests cannot exceed listing capacity.

Overlapping active bookings must be rejected.

Cancelled bookings should not block availability.

Review rating must be between 1 and 5.

Review must reference a valid booking.

One booking can have at most one review.

Wishlist entries must be unique per user/listing.

Listing images must reference a valid listing.

Listing amenities must reference valid listings and amenities.
```

---

# 33. Source of Truth

Important distinction:

### Database is responsible for:

- Persistence
- Relationships
- Foreign keys
- Unique constraints
- Basic integrity

### Backend service layer is responsible for:

- Booking business rules
- Authorization
- Price calculation
- Availability logic
- Review eligibility
- Host ownership checks
- Request validation

### Frontend is responsible for:

- User experience
- Input collection
- Displaying data
- Client-side convenience validation
- Loading/error/empty states

The frontend must NOT be treated as the source of truth for business rules.

---

# 34. Final ER Diagram

```text
┌─────────────────────┐
│        USERS        │
├─────────────────────┤
│ PK id               │
│ name                │
│ email               │
│ role                │
│ avatar_url          │
│ created_at          │
└─────────┬───────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│      LISTINGS       │
├─────────────────────┤
│ PK id               │
│ FK host_id          │
│ title               │
│ description         │
│ property_type       │
│ location            │
│ price_per_night     │
│ max_guests          │
│ bedrooms            │
│ beds                │
│ bathrooms           │
│ latitude            │
│ longitude           │
│ created_at          │
│ updated_at          │
└──────┬─────┬────────┘
       │     │
       │     │
       │     └───────────────────┐
       │                         │
       ▼                         ▼
┌───────────────┐       ┌────────────────────┐
│ LISTING_IMAGES │       │ LISTING_AMENITIES  │
├───────────────┤       ├────────────────────┤
│ PK id         │       │ FK listing_id      │
│ FK listing_id │       │ FK amenity_id      │
│ url           │       └─────────┬──────────┘
│ position      │                 │
└───────────────┘                 │
                                  ▼
                         ┌────────────────┐
                         │   AMENITIES    │
                         ├────────────────┤
                         │ PK id          │
                         │ name           │
                         └────────────────┘


LISTINGS
   │
   │ 1:N
   ▼
┌─────────────────────┐
│      BOOKINGS       │
├─────────────────────┤
│ PK id               │
│ FK listing_id       │
│ FK guest_id         │
│ check_in            │
│ check_out           │
│ guests              │
│ status              │
│ total_price         │
│ created_at          │
└─────────┬───────────┘
          │
          │ 1:0..1
          ▼
┌─────────────────────┐
│       REVIEWS       │
├─────────────────────┤
│ PK id               │
│ FK listing_id       │
│ FK user_id          │
│ FK booking_id       │
│ rating              │
│ comment             │
│ created_at          │
└─────────────────────┘


USERS
   │
   │ 1:N
   ▼
┌─────────────────────┐
│     WISHLISTS       │
├─────────────────────┤
│ PK id               │
│ FK user_id          │
│ FK listing_id       │
│ created_at          │
└─────────────────────┘
```

---

# 35. Database Acceptance Criteria

The database implementation is complete when:

- [ ] All required tables exist.
- [ ] Foreign keys are correctly configured.
- [ ] User emails are unique.
- [ ] Listing ownership is represented.
- [ ] Multiple images per listing are supported.
- [ ] Amenities use a many-to-many relationship.
- [ ] Wishlist duplicates are prevented.
- [ ] Booking dates are stored correctly.
- [ ] Booking status is stored.
- [ ] Historical booking totals are stored.
- [ ] Review-to-booking relationship exists.
- [ ] One review per booking is enforced.
- [ ] Important indexes exist.
- [ ] Alembic migrations work.
- [ ] Seed script works.
- [ ] Seed data demonstrates availability conflicts.
- [ ] SQLAlchemy relationships work correctly.
- [ ] Database survives application restart with data intact.

---

# 36. Implementation Rule for Coding Agent

When implementing the database:

1. Follow this document as the source of truth.
2. Create SQLAlchemy models based on these entities.
3. Add appropriate relationships.
4. Add foreign keys.
5. Add unique constraints.
6. Add useful indexes.
7. Create Alembic migrations.
8. Create a repeatable seed script.
9. Test database creation from an empty SQLite database.
10. Test database relationships before implementing the rest of the API.

Do not introduce additional database technologies.

Do not skip migrations.

Do not put all database logic into a single model file.

Keep the implementation modular and understandable.