-- ============================================
-- Ticket Booking System - Database Schema
-- ============================================

-- ---------- ENUM TYPES ----------

CREATE TYPE user_role AS ENUM (
    'CUSTOMER',
    'ORGANISER',
    'ADMIN'
);

CREATE TYPE event_type AS ENUM (
    'MOVIE',
    'CONCERT',
    'OTHER'
);

CREATE TYPE event_status AS ENUM (
    'DRAFT',
    'OPEN_FOR_BOOKING',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE seat_status AS ENUM (
    'AVAILABLE',
    'HELD',
    'BOOKED'
);

CREATE TYPE booking_status AS ENUM (
    'CONFIRMED',
    'CANCELLED'
);

CREATE TYPE waitlist_status AS ENUM (
    'WAITING',
    'OFFERED',
    'FULFILLED',
    'EXPIRED',
    'REMOVED'
);

CREATE TYPE offer_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'CANCELLED'
);


-- ---------- USERS ----------

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL
        CHECK (length(trim(name)) >= 2),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    verification_token TEXT UNIQUE,

    verification_expires_at TIMESTAMPTZ,

    role user_role NOT NULL DEFAULT 'CUSTOMER',


    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------- VENUES ----------

CREATE TABLE venues (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    location VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------- SEATS ----------

CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,

    venue_id BIGINT NOT NULL
        REFERENCES venues(id)
        ON DELETE CASCADE,

    row_label VARCHAR(10) NOT NULL,

    seat_number INTEGER NOT NULL
        CHECK (seat_number > 0),

    category VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (venue_id, row_label, seat_number)
);


-- ---------- EVENTS ----------

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,

    organiser_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    venue_id BIGINT NOT NULL
        REFERENCES venues(id)
        ON DELETE RESTRICT,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    event_type event_type NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,

    end_time TIMESTAMPTZ NOT NULL,

    status event_status NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_time > start_time)
);


-- ---------- EVENT SEATS ----------
-- One physical seat gets one record for each event.

CREATE TABLE event_seats (
    id BIGSERIAL PRIMARY KEY,

    event_id BIGINT NOT NULL
        REFERENCES events(id)
        ON DELETE CASCADE,

    seat_id BIGINT NOT NULL
        REFERENCES seats(id)
        ON DELETE RESTRICT,

    category VARCHAR(50) NOT NULL,

    price NUMERIC(10, 2) NOT NULL
        CHECK (price >= 0),

    status seat_status NOT NULL DEFAULT 'AVAILABLE',

    held_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    hold_expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (event_id, seat_id),

    CHECK (
        (status = 'HELD' AND held_by IS NOT NULL AND hold_expires_at IS NOT NULL)
        OR
        (status <> 'HELD')
    )
);


-- ---------- BOOKINGS ----------

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,

    booking_reference VARCHAR(30) NOT NULL UNIQUE,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    event_id BIGINT NOT NULL
        REFERENCES events(id)
        ON DELETE RESTRICT,

    total_amount NUMERIC(10, 2) NOT NULL
        CHECK (total_amount >= 0),

    status booking_status NOT NULL DEFAULT 'CONFIRMED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    cancelled_at TIMESTAMPTZ,

    CHECK (
        (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
        OR
        (status = 'CONFIRMED' AND cancelled_at IS NULL)
    )
);


-- ---------- BOOKING SEATS ----------

CREATE TABLE booking_seats (
    id BIGSERIAL PRIMARY KEY,

    booking_id BIGINT NOT NULL
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    event_seat_id BIGINT NOT NULL
        REFERENCES event_seats(id)
        ON DELETE RESTRICT,

    price NUMERIC(10, 2) NOT NULL
        CHECK (price >= 0),

    UNIQUE (booking_id, event_seat_id)
);


-- ---------- WAITLIST ----------

CREATE TABLE waitlists (
    id BIGSERIAL PRIMARY KEY,

    event_id BIGINT NOT NULL
        REFERENCES events(id)
        ON DELETE CASCADE,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    category VARCHAR(50) NOT NULL,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    status waitlist_status NOT NULL DEFAULT 'WAITING'
);


-- ---------- WAITLIST OFFERS ----------

CREATE TABLE waitlist_offers (
    id BIGSERIAL PRIMARY KEY,

    waitlist_id BIGINT NOT NULL
        REFERENCES waitlists(id)
        ON DELETE CASCADE,

    event_seat_id BIGINT NOT NULL
        REFERENCES event_seats(id)
        ON DELETE RESTRICT,

    offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    status offer_status NOT NULL DEFAULT 'PENDING',

    CHECK (expires_at > offered_at)
);


-- ---------- INDEXES ----------

CREATE INDEX idx_events_start_time
    ON events(start_time);

CREATE INDEX idx_events_organiser
    ON events(organiser_id);

CREATE INDEX idx_event_seats_event_status
    ON event_seats(event_id, status);

CREATE INDEX idx_event_seats_hold_expiry
    ON event_seats(hold_expires_at);

CREATE INDEX idx_bookings_user
    ON bookings(user_id);

CREATE INDEX idx_bookings_event
    ON bookings(event_id);

CREATE INDEX idx_booking_seats_booking
    ON booking_seats(booking_id);

CREATE INDEX idx_waitlists_event_category
    ON waitlists(event_id, category, status);

CREATE INDEX idx_waitlist_offers_expiry
    ON waitlist_offers(expires_at);


-- ---------- ACTIVE WAITLIST PROTECTION ----------

CREATE UNIQUE INDEX unique_active_waitlist_entry
    ON waitlists(event_id, user_id, category)
    WHERE status IN ('WAITING', 'OFFERED');


-- ---------- ONE PENDING OFFER PER SEAT ----------

CREATE UNIQUE INDEX unique_pending_offer_per_seat
    ON waitlist_offers(event_seat_id)
    WHERE status = 'PENDING';