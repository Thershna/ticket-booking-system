# 🎟️ Ticket Booking System

A full-stack web-based ticket booking platform that allows customers to browse events, search and filter events, select seats, temporarily hold seats, book tickets, manage bookings, receive QR-based tickets, and join waitlists.

Organisers can create events, manage venues and seats, configure ticket prices, open events for booking, and monitor bookings, seats, and revenue.

---

## 🌐 Live Application

### Frontend

https://ticket-booking-frontend-th00.onrender.com

### 🔑 Organiser Evaluation Access

The organiser module is available for evaluation using the credentials below.(It will be removed after evaluation)

**Organiser Login Email:**  
thershnatk@gmail.com

**Organiser Password:**  
12345678

After logging in, the evaluator can access:

- Organiser Dashboard
- Create Event
- Select Venue
- Manage Seats
- Generate Event Seats
- Set Ticket Prices
- Open Events for Booking
- Monitor Bookings
- Monitor Revenue

> **Note:** These credentials are provided specifically for evaluating the organiser-side functionality of the application.

### Backend API

https://ticket-booking-system-dwny.onrender.com

### API Health Check

https://ticket-booking-system-dwny.onrender.com/api/health

---

# ✨ Features

## 👤 Customer Features

- User registration
- User login
- JWT-based authentication
- Browse upcoming events
- Search events by name
- Filter events by date
- Filter events by category/event type
- Clear event filters
- View event details
- View available seats
- Visual seat selection
- Temporary seat holding
- Seat hold expiry handling
- Confirm ticket bookings
- View booking history
- View booking details
- Cancel bookings
- Join event waitlists
- Accept waitlist offers
- QR code generated for confirmed tickets
- QR ticket displayed on the booking confirmation page
- Download QR ticket as an image
- Booking confirmation email
- Booking confirmation email includes ticket details and QR code

---

## 👨‍💼 Organiser Features

- Organiser login
- Organiser dashboard
- Create events
- Select venues
- Configure venue seats
- Generate event seats
- Set standard and premium ticket prices
- Open events for booking
- Monitor available seats
- Monitor booked seats
- View total bookings
- Track event revenue
- Manage seats for individual events

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- React Router
- JavaScript
- CSS
- `qrcode.react`

## Backend

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JWT
- bcrypt
- `qrcode`
- Brevo Transactional Email API

## Database

- PostgreSQL

## Deployment

- Render

## Version Control

- Git
- GitHub

---

# 🔐 Authentication

The application uses JWT-based authentication.

## Security

- Passwords are hashed using bcrypt before storage.
- JWT tokens are used for authenticated API requests.
- Protected routes require authentication.
- Customer and organiser functionality is separated using user roles.
- Sensitive environment variables are not committed to the repository.

## User Roles

- `CUSTOMER`
- `ORGANISER`

---

# 🎫 Booking System

The booking system is designed to prevent multiple users from booking the same seat.

## Booking Flow

```text
Select Seats
     ↓
Hold Seats
     ↓
Confirm Booking
     ↓
Booking Created
     ↓
Seats Marked BOOKED
     ↓
QR Ticket Generated
     ↓
Booking Confirmation Page
     ↓
Confirmation Email
```

## Seat Lifecycle

```text
AVAILABLE
    ↓
   HELD
    ↓
  BOOKED
```

Seats can be temporarily held before confirmation.

Expired holds are automatically treated as available again.

After successful confirmation, selected seats become `BOOKED` and cannot be booked by another customer.

---

# 📱 QR Ticket

After a successful booking, a QR code is generated using the unique booking reference.

The QR ticket is:

- Displayed immediately on the Booking Confirmation page
- Downloadable as a PNG image
- Included in the booking confirmation email

The booking confirmation page displays:

- Booking reference
- Event
- Seats
- Total amount
- QR ticket
- Download QR Ticket option

Example flow:

```text
Booking Confirmed
       ↓
Booking Reference
       ↓
QR Code Generated
       ↓
QR Displayed
       ↓
Download QR Ticket
```

---

# 📧 Booking Confirmation Email

The system sends a booking confirmation email using the **Brevo Transactional Email API**.

The email contains:

- Customer name
- Event name
- Booking reference
- Date and time
- Venue
- Venue location
- Selected seats
- Total amount
- QR ticket

The email integration uses an HTTP API rather than SMTP, allowing it to work with the deployed Render backend.

Sensitive Brevo credentials are stored as environment variables and are not committed to GitHub.

---

# 🔎 Event Search & Filtering

Customers can easily find events using the filtering interface.

Supported filters:

- Search by event name
- Filter by date
- Filter by event category/type
- Clear all filters

Example:

```text
Search: Rhythm
Date: 25 Aug 2026
Category: CONCERT
        ↓
Matching events displayed
```

Filtering is performed on the events retrieved from the backend.

---

# ⏳ Waitlist Management

When an event has no available seats, customers can join the waitlist.

## Waitlist Flow

```text
No Available Seats
        ↓
   Join Waitlist
        ↓
      WAITING
        ↓
Seat Becomes Available
        ↓
  Waitlist Offer
        ↓
   Accept Offer
        ↓
      Booking
```

The system supports:

- Joining a waitlist
- Tracking waitlist status
- Creating waitlist offers
- Accepting waitlist offers
- Expiring waitlist offers

---

# 🪑 Seat Management

The system supports venue-level physical seat configuration.

Each seat contains:

- Venue
- Row
- Seat number
- Category

Example:

```text
        SCREEN
  -------------------

     A1  A2  A3  A4  A5
     B1  B2  B3  B4  B5
     C1  C2  C3  C4  C5
```

## Seat Categories

- `STANDARD`
- `PREMIUM`

Event-specific ticket prices can be configured for different seat categories.

---

# 🏢 Venues

The application supports multiple venues.

Example venues configured in the application:

| Venue | Location |
|---|---|
| Chennai Music Arena | Sholinganallur, Chennai |
| CineVerse Theatre | OMR, Chennai |
| OMR Convention Centre | Navalur, Chennai |
| Laugh Lounge | Velachery, Chennai |
| Marina Event Hall | Adyar, Chennai |
| Phoenix Performance Hall | Velachery, Chennai |
| Chennai Grand Auditorium | Guindy, Chennai |
| Bay View Convention Centre | ECR, Chennai |

---

# 📅 Event Management

Organisers can create events with:

- Event title
- Event description
- Event type
- Venue
- Start date and time
- End date and time
- Ticket prices

## Supported Event Types

- `MOVIE`
- `CONCERT`
- `OTHER`

## Event Status

```text
DRAFT
  ↓
OPEN_FOR_BOOKING
  ↓
ONGOING
  ↓
COMPLETED
```

Events can also be marked as `CANCELLED`.

---

# 👨‍💼 Organiser Dashboard

The organiser dashboard provides an overview of event performance.

It displays:

- Total events
- Upcoming events
- Total bookings
- Total revenue
- Total seats
- Available seats
- Booked seats
- Event-level bookings
- Event-level revenue

Organisers can also access seat management for individual events.

---

# 🔄 Customer Booking Workflow

```text
Customer Registration
        ↓
Customer Login
        ↓
Browse Events
        ↓
Search / Filter Events
        ↓
Select Event
        ↓
View Event Details
        ↓
View Available Seats
        ↓
Select Seats
        ↓
Hold Seats
        ↓
Confirm Booking
        ↓
Booking Successful
        ↓
QR Ticket Generated
        ↓
Confirmation Email Sent
        ↓
View My Bookings
        ↓
View Booking Details
        ↓
Cancel Booking
```

---

# 🔄 Organiser Workflow

```text
Organiser Login
        ↓
Organiser Dashboard
        ↓
Create Event
        ↓
Select Venue
        ↓
Configure Seats
        ↓
Set Ticket Prices
        ↓
Generate Event Seats
        ↓
Open Event for Booking
        ↓
Monitor Seats
        ↓
Monitor Bookings
        ↓
Monitor Revenue
```

---

# 🗄️ Database

The application uses PostgreSQL as its relational database.

The database schema is located at:

```text
database/schema.sql
```

## Main Tables

| Table | Purpose |
|---|---|
| `users` | Stores customer and organiser accounts |
| `venues` | Stores venue information |
| `seats` | Stores physical venue seats |
| `events` | Stores event information |
| `event_seats` | Associates seats with individual events |
| `bookings` | Stores booking information |
| `booking_seats` | Stores seats included in bookings |
| `waitlists` | Stores customer waitlist entries |
| `waitlist_offers` | Stores waitlist seat offers |

## Database Features

- Primary keys
- Foreign keys
- PostgreSQL ENUM types
- Unique constraints
- Check constraints
- Indexes
- Partial unique indexes
- Cascading deletes where appropriate
- Referential integrity

---

# 🧩 Database Relationship Overview

```text
Users
  │
  ├───────────────┐
  │               │
  ↓               ↓
Bookings        Events
  │               │
  ↓               ↓
Booking Seats   Event Seats
                    │
                    ↓
                  Seats
                    │
                    ↓
                  Venues
```

Waitlist information is associated with users, events, and event seats.

---

# 📁 Project Structure

```text
ticket-booking-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── SeatSelection.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── BookingDetails.jsx
│   │   │   ├── OrganiserDashboard.jsx
│   │   │   ├── CreateEvent.jsx
│   │   │   └── ManageSeats.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── .gitignore
│
└── README.md
```

---

# 🔌 API

The frontend communicates with the backend through REST API endpoints.

## Production Backend

https://ticket-booking-system-dwny.onrender.com

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

## Health Check

```text
GET /api/health
```

## Events

```text
GET /api/events
GET /api/events/:id
GET /api/events/:id/seats
```

## Event Management

```text
POST /api/events
PATCH /api/events/:id/open
POST /api/events/:eventId/seats
```

## Booking

```text
POST /api/events/:eventId/hold
POST /api/events/:eventId/confirm
GET /api/my
GET /api/:bookingId
PATCH /api/:bookingId/cancel
```

## Waitlist

```text
POST /api/events/:eventId/waitlist
GET /api/waitlist/my-offers
POST /api/waitlist/offers/:offerId/accept
```

---

# 🚀 Running Locally

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/Thershna/ticket-booking-system.git
cd ticket-booking-system
```

---

## 2. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend runs on:

```text
http://localhost:5000
```

Configure the required backend environment variables in a local `.env` file.

---

## 3. Database Setup

Create a PostgreSQL database.

Then execute:

```text
database/schema.sql
```

This creates the required tables, ENUM types, constraints, indexes, and relationships.

---

## 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs using the Vite development server.

---

# 🌍 Deployment

The application is deployed using Render.

## Frontend

React/Vite frontend deployed as a Render Static Site.

## Backend

Node.js/Express backend deployed as a Render Web Service.

## Database

PostgreSQL database hosted on Render.

## Email

Brevo Transactional Email API is used for booking confirmation emails.

## Production Architecture

```text
                 ┌─────────────────────┐
                 │      Customer       │
                 └──────────┬──────────┘
                            │
                            ↓
                 ┌─────────────────────┐
                 │   React Frontend    │
                 │       Render        │
                 └──────────┬──────────┘
                            │
                         REST API
                            │
                            ↓
                 ┌─────────────────────┐
                 │ Node.js + Express   │
                 │       Render        │
                 └──────────┬──────────┘
                            │
                  ┌─────────┴─────────┐
                  ↓                   ↓
        ┌─────────────────┐   ┌─────────────────┐
        │   PostgreSQL    │   │     Brevo       │
        │     Render      │   │ Transactional   │
        └─────────────────┘   │   Email API     │
                              └─────────────────┘
```

---

# 🔒 Environment Variables

Sensitive configuration values are stored using environment variables and are not committed to the GitHub repository.

Typical backend configuration includes:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
BREVO_API_KEY
BREVO_SENDER_EMAIL
```

Frontend configuration:

```text
VITE_API_URL
```

Actual secret values are intentionally excluded from this repository.

---

# 🧪 Testing

## Customer Testing

1. Register a customer account.
2. Login.
3. Browse available events.
4. Search or filter events.
5. Open an event.
6. View event details.
7. Select available seats.
8. Hold the selected seats.
9. Confirm the booking.
10. Verify the booking confirmation page.
11. Verify the QR ticket.
12. Download the QR ticket.
13. Check the booking confirmation email.
14. Open My Bookings.
15. View booking details.
16. Cancel a booking if required.
17. Test the waitlist when seats are unavailable.

## Organiser Testing

1. Login using the organiser account.
2. Open the organiser dashboard.
3. Create an event.
4. Select a venue.
5. Configure seats.
6. Set ticket prices.
7. Generate event seats.
8. Open the event for booking.
9. Monitor available and booked seats.
10. View bookings.
11. View revenue.

---

# 👨‍💼 Evaluator / Organiser Access

The application currently has a configured organiser account for evaluation.

### Organiser Login

Use the organiser credentials provided separately with the assignment submission.

> The password is intentionally not stored in this public README.

After logging in, the evaluator can access:

```text
Organiser Dashboard
       ↓
Create Event
       ↓
Select Venue
       ↓
Manage Seats
       ↓
Generate Event Seats
       ↓
Set Ticket Prices
       ↓
Open Event
       ↓
Monitor Bookings
       ↓
Monitor Revenue
```

---

# 🔎 API Health Check

The backend provides a health-check endpoint:

```text
GET /api/health
```

Production:

https://ticket-booking-system-dwny.onrender.com/api/health

A successful response confirms that the deployed backend API is running.

---

# 🎯 Project Objectives

The main objectives of this project are:

1. Develop a full-stack online ticket booking platform.
2. Allow customers to browse and book event tickets.
3. Implement visual seat selection.
4. Prevent duplicate seat bookings.
5. Implement temporary seat holding.
6. Provide booking confirmation and cancellation.
7. Implement waitlist functionality.
8. Generate QR-based tickets.
9. Send booking confirmation emails.
10. Provide organisers with event and seat management.
11. Provide booking and revenue statistics.
12. Provide event search and filtering.
13. Deploy the application using cloud infrastructure.

---

# 📌 Project Status

The ticket booking system has been implemented and deployed.

## Implemented Modules

- Customer authentication
- Organiser authentication
- Event browsing
- Event search
- Event date filtering
- Event category filtering
- Venue management
- Event management
- Seat configuration
- Seat generation
- Seat selection
- Seat holding
- Ticket booking
- Booking history
- Booking details
- Booking cancellation
- Waitlist management
- Organiser dashboard
- Booking statistics
- Revenue monitoring
- QR ticket generation
- QR ticket download
- Booking confirmation email
- PostgreSQL database integration
- Cloud deployment

---

# 🚀 Future Enhancements

Possible future improvements include:

- Online payment gateway integration
- Discount and coupon management
- Advanced analytics
- Multiple organiser accounts
- Dedicated admin management dashboard
- Advanced notification preferences
- QR scanning/entry validation system

---

# 👩‍💻 Author

**Thershna**

Electronics and Communication Engineering

### GitHub

https://github.com/Thershna

### Project Repository

https://github.com/Thershna/ticket-booking-system

---

# 📜 License

This project was developed as an academic/project implementation demonstrating a full-stack ticket booking system.

---

# 🔗 Project Links

### GitHub Repository

https://github.com/Thershna/ticket-booking-system

### Live Frontend

https://ticket-booking-frontend-th00.onrender.com

### Backend API

https://ticket-booking-system-dwny.onrender.com

### API Health Check

https://ticket-booking-system-dwny.onrender.com/api/health
