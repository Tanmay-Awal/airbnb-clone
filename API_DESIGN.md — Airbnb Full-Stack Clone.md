# Airbnb Web App — API Design

## 1. Purpose

This document defines the REST API contract between the Next.js frontend and FastAPI backend.

The API is responsible for:

- User/session information
- Listing discovery
- Listing details
- Search and filtering
- Availability
- Booking creation
- Booking management
- Host listing management
- Host booking management
- Wishlist management
- Reviews

The API must enforce business rules on the backend.

The frontend must never be considered trusted.

---

# 2. API Base URL

Local development:

```text
http://localhost:8000
```

API prefix:

```text
/api
```

Therefore:

```text
GET /api/listings
```

---

# 3. API Architecture

The request flow should generally be:

```text
Next.js
   ↓
HTTP Request
   ↓
FastAPI Router
   ↓
Pydantic Validation
   ↓
Authentication / Current User
   ↓
Service Layer
   ↓
SQLAlchemy
   ↓
SQLite
   ↓
Response Schema
   ↓
Next.js
```

Route handlers should remain relatively thin.

Business logic should live in service modules.

---

# 4. Response Format

Successful responses should use predictable JSON structures.

For example:

```json
{
  "id": 1,
  "title": "Beautiful Beach Villa"
}
```

Collection endpoints should generally return:

```json
{
  "items": [],
  "page": 1,
  "limit": 12,
  "total": 30,
  "has_next": true
}
```

Errors should use FastAPI's standard HTTP error mechanism with a useful message.

Example:

```json
{
  "detail": "Property is no longer available for the selected dates."
}
```

---

# 5. HTTP Status Codes

Use status codes consistently.

```text
200 OK
```

Successful GET/update operations.

```text
201 Created
```

Successful creation.

```text
204 No Content
```

Successful deletion where appropriate.

```text
400 Bad Request
```

Invalid request.

```text
401 Unauthorized
```

No authenticated user.

```text
403 Forbidden
```

User does not have permission.

```text
404 Not Found
```

Resource does not exist.

```text
409 Conflict
```

Business conflict such as an unavailable property.

```text
422 Unprocessable Entity
```

Schema/input validation failure.

---

# 6. Authentication Model

For the assignment, authentication can be lightweight/demo-oriented.

We do not need a production OAuth system.

The application should nevertheless have a consistent concept of the current user.

The backend should expose:

```text
GET /api/me
```

The implementation may use a simple demo-user mechanism.

The important requirement is that backend authorization can determine:

```text
current_user.id
current_user.role
```

This allows us to enforce host ownership and guest operations.

---

# 7. Current User

## GET `/api/me`

### Purpose

Return the currently selected/authenticated user.

### Authentication

Required.

### Response

```json
{
  "id": 4,
  "name": "Tanmay",
  "email": "tanmay@example.com",
  "role": "GUEST",
  "avatar_url": "https://..."
}
```

---

# 8. Demo User Selection

If implementing demo authentication rather than real login, provide a simple mechanism for selecting a seeded user.

Possible conceptual endpoint:

```text
POST /api/demo/login
```

Request:

```json
{
  "user_id": 4
}
```

Response:

```json
{
  "message": "Logged in successfully",
  "user": {
    "id": 4,
    "name": "Tanmay",
    "role": "GUEST"
  }
}
```

The exact session/token mechanism can be chosen during implementation.

The important requirement is that subsequent requests can identify the current user.

---

# 9. Listings API

Listings are the central resource in the application.

---

# 10. GET `/api/listings`

## Purpose

Retrieve paginated listings with optional search and filtering.

This endpoint powers the main home/search page.

---

## Query Parameters

```text
location
check_in
check_out
guests
min_price
max_price
property_type
amenities
page
limit
```

All parameters except `page` and `limit` are optional.

---

## Example

```text
GET /api/listings?location=Goa&guests=4&page=1&limit=12
```

With dates:

```text
GET /api/listings?location=Goa&check_in=2026-10-10&check_out=2026-10-15&guests=4
```

With price:

```text
GET /api/listings?min_price=2000&max_price=10000
```

With property type:

```text
GET /api/listings?property_type=Villa
```

With amenities:

```text
GET /api/listings?amenities=WiFi&amenities=Pool
```

---

# 11. Listing Search Rules

### Location

Location should initially use text matching.

For example:

```text
Goa
```

should match relevant listing locations such as:

```text
Candolim, Goa
Anjuna, Goa
Baga, Goa
```

The exact matching strategy can be implemented using SQLite-compatible string matching.

---

### Guests

Only return listings where:

```text
listing.max_guests >= requested_guests
```

---

### Price

If provided:

```text
price_per_night >= min_price
```

and:

```text
price_per_night <= max_price
```

---

### Property type

Match the requested property type.

---

### Amenities

A listing must contain the requested amenities.

If the user requests:

```text
WiFi
Pool
```

the listing must have both.

---

### Dates

If both `check_in` and `check_out` are provided:

Only return listings that have no overlapping active bookings.

---

# 12. Listing Search Response

Example:

```json
{
  "items": [
    {
      "id": 1,
      "title": "Beautiful Beach Villa",
      "location": "Candolim, Goa",
      "price_per_night": 5000,
      "cover_image": "https://...",
      "property_type": "Villa",
      "max_guests": 6,
      "rating": 4.8,
      "review_count": 42
    }
  ],
  "page": 1,
  "limit": 12,
  "total": 25,
  "has_next": true
}
```

The listing card should not require multiple additional API requests per listing.

Avoid N+1 API calls.

---

# 13. Pagination

Defaults:

```text
page = 1
limit = 12
```

The backend should enforce a maximum limit.

For example:

```text
maximum limit = 50
```

This prevents clients from requesting an unreasonably large dataset.

---

# 14. GET `/api/listings/{listing_id}`

## Purpose

Retrieve complete listing information.

### Example

```text
GET /api/listings/1
```

### Response

```json
{
  "id": 1,
  "title": "Beautiful Beach Villa",
  "description": "A beautiful property near the beach.",
  "location": "Candolim, Goa",
  "property_type": "Villa",
  "price_per_night": 5000,
  "max_guests": 6,
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 2,
  "latitude": 15.516,
  "longitude": 73.762,
  "images": [
    {
      "id": 1,
      "url": "https://...",
      "position": 0
    }
  ],
  "amenities": [
    {
      "id": 1,
      "name": "WiFi"
    },
    {
      "id": 2,
      "name": "Pool"
    }
  ],
  "host": {
    "id": 1,
    "name": "Rahul",
    "avatar_url": "https://..."
  },
  "rating": 4.8,
  "review_count": 42
}
```

---

# 15. GET `/api/listings/{listing_id}/availability`

## Purpose

Check whether a listing is available for a date range.

### Query Parameters

```text
check_in
check_out
```

Example:

```text
GET /api/listings/1/availability?check_in=2026-10-10&check_out=2026-10-15
```

### Response

Available:

```json
{
  "available": true
}
```

Unavailable:

```json
{
  "available": false,
  "reason": "Property is already booked for the selected dates."
}
```

---

# 16. Availability Rules

The backend must check:

```text
existing.check_in < requested.check_out
AND
existing.check_out > requested.check_in
```

Only relevant active bookings should block availability.

Cancelled bookings do not block dates.

---

# 17. POST `/api/listings`

## Purpose

Create a new listing.

### Authentication

Required.

### Authorization

Current user must have:

```text
role = HOST
```

---

## Request

```json
{
  "title": "Luxury Beach Villa",
  "description": "Beautiful villa near the beach.",
  "property_type": "Villa",
  "location": "Candolim, Goa",
  "price_per_night": 6500,
  "max_guests": 6,
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 2,
  "latitude": 15.516,
  "longitude": 73.762,
  "amenity_ids": [1, 2, 3],
  "images": [
    {
      "url": "https://...",
      "position": 0
    },
    {
      "url": "https://...",
      "position": 1
    }
  ]
}
```

---

# 18. Create Listing Validation

Validate:

```text
title is not empty

description is not empty

property_type is valid

location is not empty

price_per_night > 0

max_guests > 0

bedrooms >= 0

beds >= 0

bathrooms >= 0
```

All supplied amenities must exist.

Image URLs should be validated as appropriate.

---

# 19. Create Listing Response

Status:

```text
201 Created
```

Return the newly created listing.

---

# 20. PATCH `/api/listings/{listing_id}`

## Purpose

Update an existing listing.

### Authentication

Required.

### Authorization

The current user must own the listing.

Conceptually:

```text
current_user.id == listing.host_id
```

---

## Request

Fields may be partial.

Example:

```json
{
  "title": "Updated Beach Villa",
  "price_per_night": 7000
}
```

---

# 21. Update Listing Rules

A host cannot modify another host's listing.

If:

```text
listing.host_id != current_user.id
```

return:

```text
403 Forbidden
```

The backend should validate every updated field.

---

# 22. DELETE `/api/listings/{listing_id}`

## Purpose

Delete/archive a listing.

### Authentication

Required.

### Authorization

Current user must own the listing.

---

## Important Rule

Do not destroy historical booking information unnecessarily.

If a listing has important historical bookings, the implementation should prefer a safe deletion/archive strategy rather than breaking references.

For the MVP, it is acceptable to reject deletion when the listing cannot safely be deleted.

Return:

```text
409 Conflict
```

when deletion conflicts with existing data.

---

# 23. Host Listings

## GET `/api/host/listings`

### Purpose

Return listings owned by the current host.

### Authentication

Required.

### Authorization

Current user must be a host.

### Response

```json
{
  "items": [
    {
      "id": 1,
      "title": "Beach Villa",
      "location": "Goa",
      "price_per_night": 5000,
      "cover_image": "https://...",
      "booking_count": 5
    }
  ]
}
```

---

# 24. Host Bookings

## GET `/api/host/bookings`

### Purpose

Return bookings belonging to listings owned by the current host.

### Authentication

Required.

### Authorization

Host only.

### Response

```json
{
  "items": [
    {
      "id": 100,
      "listing": {
        "id": 1,
        "title": "Beach Villa"
      },
      "guest": {
        "id": 4,
        "name": "Tanmay"
      },
      "check_in": "2026-10-10",
      "check_out": "2026-10-15",
      "guests": 3,
      "total_price": 28000,
      "status": "CONFIRMED"
    }
  ]
}
```

---

# 25. POST `/api/bookings`

## Purpose

Create a booking.

This is one of the most important endpoints in the system.

### Authentication

Required.

The current user becomes:

```text
guest_id
```

---

# 26. Create Booking Request

```json
{
  "listing_id": 1,
  "check_in": "2026-10-10",
  "check_out": "2026-10-15",
  "guests": 4
}
```

The client should NOT send:

```text
total_price
```

as the authoritative value.

The backend calculates it.

---

# 27. Create Booking Validation

The backend must verify:

### Listing exists

If not:

```text
404
```

---

### Dates

```text
check_in < check_out
```

---

### Check-in

Must not be in the past.

---

### Guests

```text
guests > 0
```

and:

```text
guests <= listing.max_guests
```

---

### Availability

Check overlapping bookings immediately before insertion.

---

# 28. Booking Creation Transaction

The operation should conceptually be:

```text
BEGIN

Find listing

Validate dates

Validate guests

Check overlapping bookings

Calculate nights

Calculate price

Create booking

COMMIT
```

If anything fails:

```text
ROLLBACK
```

---

# 29. Booking Conflict Response

If dates are no longer available:

```text
409 Conflict
```

Example:

```json
{
  "detail": "Property is no longer available for the selected dates."
}
```

This is important because availability can change between:

```text
GET /availability
```

and:

```text
POST /bookings
```

The booking endpoint must always perform its own final availability check.

---

# 30. Booking Price Calculation

The backend calculates:

```text
nights = check_out - check_in

base_price =
    listing.price_per_night * nights
```

Then:

```text
cleaning_fee
service_fee
```

are calculated.

Finally:

```text
total_price =
    base_price
    + cleaning_fee
    + service_fee
```

The exact fee percentages/constants should be centralized rather than scattered through route handlers.

---

# 31. Booking Response

Status:

```text
201 Created
```

Example:

```json
{
  "id": 100,
  "listing_id": 1,
  "guest_id": 4,
  "check_in": "2026-10-10",
  "check_out": "2026-10-15",
  "guests": 4,
  "status": "CONFIRMED",
  "price_breakdown": {
    "nights": 5,
    "price_per_night": 5000,
    "base_price": 25000,
    "cleaning_fee": 1500,
    "service_fee": 2650,
    "total_price": 29150
  },
  "created_at": "2026-09-07T10:00:00"
}
```

---

# 32. GET `/api/bookings`

## Purpose

Return bookings for the current guest.

### Authentication

Required.

### Response

```json
{
  "items": [
    {
      "id": 100,
      "listing": {
        "id": 1,
        "title": "Beach Villa",
        "location": "Goa",
        "cover_image": "https://..."
      },
      "check_in": "2026-10-10",
      "check_out": "2026-10-15",
      "guests": 4,
      "total_price": 29150,
      "status": "CONFIRMED"
    }
  ]
}
```

This endpoint powers My Trips.

---

# 33. GET `/api/bookings/{booking_id}`

## Purpose

Return a specific booking.

### Authentication

Required.

The user must have access to the booking.

A guest can access their own booking.

A host can access a booking belonging to one of their listings.

Otherwise:

```text
403 Forbidden
```

---

# 34. POST `/api/bookings/{booking_id}/cancel`

## Purpose

Cancel a booking.

### Authentication

Required.

The user must have permission to cancel it.

For the MVP, the guest who created the booking should be allowed to cancel eligible bookings.

---

## Cancellation

Do not delete the booking.

Update:

```text
status = CANCELLED
```

This preserves historical information.

---

# 35. Cancellation Response

```json
{
  "id": 100,
  "status": "CANCELLED"
}
```

Once cancelled, its dates should no longer block availability.

---

# 36. GET `/api/wishlist`

## Purpose

Return the current user's saved listings.

### Authentication

Required.

### Response

```json
{
  "items": [
    {
      "id": 1,
      "title": "Beach Villa",
      "location": "Goa",
      "price_per_night": 5000,
      "cover_image": "https://...",
      "rating": 4.8
    }
  ]
}
```

---

# 37. POST `/api/wishlist/{listing_id}`

## Purpose

Add a listing to the current user's wishlist.

### Authentication

Required.

The listing must exist.

---

## Duplicate Handling

If the listing is already in the wishlist, the API should behave predictably.

Preferred behavior:

```text
409 Conflict
```

or an idempotent success response.

The database unique constraint remains the final protection.

---

# 38. DELETE `/api/wishlist/{listing_id}`

## Purpose

Remove a listing from the current user's wishlist.

### Authentication

Required.

If the wishlist entry does not exist, return:

```text
404 Not Found
```

or make the operation idempotent.

Choose one consistent behavior.

---

# 39. GET `/api/listings/{listing_id}/reviews`

## Purpose

Return reviews for a listing.

### Authentication

Not required.

### Response

```json
{
  "items": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Amazing place!",
      "user": {
        "id": 4,
        "name": "Tanmay",
        "avatar_url": "https://..."
      },
      "created_at": "2026-09-01T10:00:00"
    }
  ],
  "average_rating": 4.8,
  "review_count": 42
}
```

---

# 40. POST `/api/listings/{listing_id}/reviews`

## Purpose

Create a review for a listing.

### Authentication

Required.

---

# 41. Review Request

```json
{
  "booking_id": 100,
  "rating": 5,
  "comment": "Amazing place and great host!"
}
```

---

# 42. Review Validation

The backend must verify:

### Listing exists

Otherwise:

```text
404
```

### Booking exists

Otherwise:

```text
404
```

### Booking belongs to current user

```text
booking.guest_id == current_user.id
```

### Booking belongs to listing

```text
booking.listing_id == listing_id
```

### Booking is completed

Only completed stays can be reviewed.

### Rating

```text
1 <= rating <= 5
```

### Duplicate review

A booking can have only one review.

If a review already exists:

```text
409 Conflict
```

---

# 43. Review Response

Status:

```text
201 Created
```

Example:

```json
{
  "id": 20,
  "listing_id": 1,
  "booking_id": 100,
  "rating": 5,
  "comment": "Amazing place!",
  "user": {
    "id": 4,
    "name": "Tanmay"
  },
  "created_at": "2026-09-07T10:30:00"
}
```

---

# 44. API Authentication Matrix

| Endpoint | Guest | Host |
|---|---:|---:|
| GET listings | ✅ | ✅ |
| GET listing | ✅ | ✅ |
| GET availability | ✅ | ✅ |
| POST listing | ❌ | ✅ |
| PATCH own listing | ❌ | ✅ |
| DELETE own listing | ❌ | ✅ |
| Host listings | ❌ | ✅ |
| Host bookings | ❌ | ✅ |
| POST booking | ✅ | ✅ |
| GET own bookings | ✅ | ✅ |
| Cancel own booking | ✅ | ✅ |
| Wishlist | ✅ | ✅ |
| View reviews | ✅ | ✅ |
| Post review | ✅ | ✅ |

A host can also act as a guest for booking purposes if the application allows this behavior.

The role primarily controls host-management functionality.

---

# 45. Authorization Rules

Authorization must be checked server-side.

## Listing ownership

```text
listing.host_id == current_user.id
```

---

## Booking ownership

Guest:

```text
booking.guest_id == current_user.id
```

Host:

```text
booking.listing.host_id == current_user.id
```

---

## Review ownership

```text
booking.guest_id == current_user.id
```

---

## Wishlist ownership

```text
wishlist.user_id == current_user.id
```

Never accept a user ID from the frontend and assume it is trustworthy.

---

# 46. Validation Strategy

Validation occurs at multiple levels.

### Frontend

Used for:

- Immediate UX feedback
- Preventing obviously invalid requests
- Form validation

### Pydantic

Used for:

- Request structure
- Types
- Required fields
- Basic constraints

### Service Layer

Used for:

- Business rules
- Ownership
- Availability
- Booking conflicts
- Review eligibility
- Price calculation

### Database

Used for:

- Foreign keys
- Unique constraints
- Basic integrity

---

# 47. API Service Structure

Recommended backend structure:

```text
backend/app/
│
├── api/
│   ├── auth.py
│   ├── listings.py
│   ├── bookings.py
│   ├── wishlist.py
│   ├── reviews.py
│   └── host.py
│
├── schemas/
│   ├── user.py
│   ├── listing.py
│   ├── booking.py
│   ├── review.py
│   └── wishlist.py
│
├── services/
│   ├── listing_service.py
│   ├── booking_service.py
│   ├── pricing_service.py
│   ├── review_service.py
│   └── wishlist_service.py
│
├── models/
│   ├── user.py
│   ├── listing.py
│   ├── booking.py
│   ├── review.py
│   └── wishlist.py
│
└── core/
    ├── database.py
    ├── config.py
    └── security.py
```

---

# 48. Example Booking Request Flow

A complete booking request should look like:

```text
POST /api/bookings
        │
        ▼
Authentication
        │
        ▼
Validate request schema
        │
        ▼
Find listing
        │
        ▼
Validate dates
        │
        ▼
Validate guest count
        │
        ▼
Check overlapping bookings
        │
        ▼
Calculate nights
        │
        ▼
Calculate price
        │
        ▼
Create booking
        │
        ▼
Commit transaction
        │
        ▼
Return confirmation
```

---

# 49. Example Search Flow

```text
GET /api/listings
        │
        ▼
Parse query parameters
        │
        ▼
Build SQLAlchemy query
        │
        ├── location
        ├── price
        ├── property type
        ├── guests
        └── amenities
        │
        ▼
Apply availability filter
        │
        ▼
Calculate rating
        │
        ▼
Apply pagination
        │
        ▼
Serialize response
        │
        ▼
Frontend listing grid
```

---

# 50. API Performance Rules

The backend should avoid:

### N+1 database queries

For example, don't execute:

```text
1 query → listings
+
1 query per listing → images
+
1 query per listing → amenities
+
1 query per listing → reviews
```

when the data can reasonably be fetched efficiently.

---

### Unbounded queries

Never return every listing by default.

Use pagination.

---

### Unnecessary payloads

Listing cards should not receive the entire review collection.

Use separate detail/review endpoints where appropriate.

---

# 51. API Error Examples

## Listing not found

```http
404 Not Found
```

```json
{
  "detail": "Listing not found."
}
```

---

## Unauthorized host action

```http
403 Forbidden
```

```json
{
  "detail": "You do not have permission to modify this listing."
}
```

---

## Invalid dates

```http
400 Bad Request
```

```json
{
  "detail": "Check-out date must be after check-in date."
}
```

---

## Too many guests

```http
400 Bad Request
```

```json
{
  "detail": "This property can accommodate a maximum of 4 guests."
}
```

---

## Booking conflict

```http
409 Conflict
```

```json
{
  "detail": "Property is no longer available for the selected dates."
}
```

---

## Duplicate review

```http
409 Conflict
```

```json
{
  "detail": "You have already reviewed this booking."
}
```

---

# 52. API Security Rules

Never trust:

```text
user_id
host_id
total_price
role
```

sent by the frontend.

The backend determines:

```text
current_user
current_user.role
listing.host_id
booking.guest_id
total_price
```

from trusted server/database state.

---

# 53. API Testing Requirements

Before frontend integration, the backend should be tested independently.

Minimum tests:

### Listings

- Get listings
- Search by location
- Filter by price
- Filter by property type
- Filter by amenities
- Filter by guests
- Pagination
- Get listing details

### Host

- Create listing
- Update own listing
- Delete own listing
- Reject modification of another host's listing

### Booking

- Valid booking
- Invalid dates
- Past dates
- Too many guests
- Overlapping booking
- Adjacent booking
- Cancel booking
- Cancelled booking no longer blocks availability

### Wishlist

- Add
- Remove
- Duplicate prevention

### Reviews

- Valid review
- Invalid rating
- Wrong booking
- Review another user's booking
- Duplicate review

---

# 54. API Acceptance Criteria

The API implementation is complete when:

- [ ] All core endpoints exist.
- [ ] Request schemas are validated.
- [ ] Response schemas are predictable.
- [ ] Authentication/current-user concept works.
- [ ] Host authorization works.
- [ ] Listing ownership is enforced.
- [ ] Search works server-side.
- [ ] Filters work.
- [ ] Pagination works.
- [ ] Availability checking works.
- [ ] Booking conflict detection works.
- [ ] Booking creation is transactional.
- [ ] Backend calculates price.
- [ ] Booking cancellation works.
- [ ] Wishlist works.
- [ ] Reviews work.
- [ ] Review eligibility is validated.
- [ ] Appropriate HTTP status codes are returned.
- [ ] Errors are understandable.
- [ ] API does not trust client-provided ownership or prices.
- [ ] API can be consumed cleanly by the Next.js frontend.

---

# 55. Implementation Rule for Coding Agent

When implementing the API:

1. Follow this document as the API contract.
2. Implement schemas before route handlers where practical.
3. Keep route handlers thin.
4. Put business logic into service modules.
5. Reuse SQLAlchemy models and relationships.
6. Never duplicate business logic unnecessarily.
7. Validate all client input.
8. Enforce authorization server-side.
9. Calculate booking totals server-side.
10. Recheck booking availability during booking creation.
11. Use transactions for booking creation.
12. Return predictable response structures.
13. Use meaningful HTTP status codes.
14. Write backend tests before declaring the API complete.
15. Do not introduce unnecessary technologies or infrastructure.

---

# 56. API Source of Truth

The hierarchy of responsibility is:

```text
Frontend
   ↓
Requests data/actions
   ↓
API
   ↓
Validates + authorizes + executes business rules
   ↓
Database
   ↓
Persists trusted state
```

The API is the boundary between the frontend and database.

The frontend should never directly access SQLite.

The frontend should never contain authoritative booking/business logic.

The backend should never depend on frontend validation for correctness.