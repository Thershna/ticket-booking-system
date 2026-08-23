# 🎟️ Ticket Booking System

A full-stack web-based ticket booking platform that allows customers to browse events, select seats, book tickets, manage bookings, and join waitlists. Organisers can create events, manage venues and seats, configure ticket prices, open events for booking, and monitor bookings and revenue.

---

## 🌐 Live Application

### Frontend
https://ticket-booking-frontend-th00.onrender.com

### Backend API
https://ticket-booking-system-dwny.onrender.com

### API Health Check
https://ticket-booking-system-dwny.onrender.com/api/health

---

## ✨ Features

### 👤 Customer Features

- User registration
- User login
- JWT-based authentication
- Browse upcoming events
- View event details
- View available seats
- Visual seat selection
- Temporary seat holding
- Confirm ticket bookings
- View booking history
- View booking details
- Cancel bookings
- Join event waitlists
- Accept waitlist offers
- QR code generated for confirmed tickets
- Email notifications for booking confirmation
- Email notifications for booking cancellation

### 👨‍💼 Organiser Features

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

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- React Router
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JWT
- bcrypt

### Database

- PostgreSQL

### Deployment

- Render

### Version Control

- Git
- GitHub

---

## 🔐 Authentication

The application uses JWT-based authentication.

### Security

- Passwords are hashed using bcrypt before storage.
- JWT tokens are used for authenticated API requests.
- Protected routes require authentication.
- Customer and organiser functionality is separated using user roles.

### User Roles

- `CUSTOMER`
- `ORGANISER`
- `ADMIN`

---

## 🎫 Booking System

The booking system prevents multiple users from booking the same seat.

## 📱 QR Ticket & Email Notifications

### QR-Based Ticket

After a successful booking, the system generates a unique QR code for the confirmed ticket.

The QR code can be used to identify and validate the booking during event entry.

### Email Notifications

Customers receive email notifications for important booking events, including:

- Booking confirmation
- Booking cancellation

The email contains the relevant booking information and ticket details.

### Ticket Flow

```text
Seat Selection
      ↓
Hold Seats
      ↓
Confirm Booking
      ↓
Booking Created
      ↓
QR Code Generated
      ↓
Confirmation Email Sent

### Seat Lifecycle

```text
AVAILABLE
    ↓
   HELD
    ↓
  BOOKED
```

Seats can be temporarily held before the booking is confirmed.

After successful confirmation, the selected seats become `BOOKED` and are no longer available to other customers.

---

## ⏳ Waitlist Management

When an event has no available seats, customers can join the waitlist.

### Waitlist Flow

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

---

## 🪑 Seat Management

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

### Seat Categories

- `STANDARD`
- `PREMIUM`

Event-specific prices can be configured for different seat categories.

---

## 🏢 Venues

The system supports multiple venues.

Example venues configured in the application:

| Venue                      | Location                |
| --------------------------- | ------------------------ |
| Chennai Music Arena        | Sholinganallur, Chennai |
| CineVerse Theatre          | OMR, Chennai            |
| OMR Convention Centre      | Navalur, Chennai        |
| Laugh Lounge               | Velachery, Chennai      |
| Marina Event Hall          | Adyar, Chennai          |
| Phoenix Performance Hall   | Velachery, Chennai      |
| Chennai Grand Auditorium   | Guindy, Chennai         |
| Bay View Convention Centre | ECR, Chennai            |

---

## 📅 Event Management

Organisers can create events with:

- Event title
- Event description
- Event type
- Venue
- Start date and time
- End date and time
- Ticket prices

### Supported Event Types

- `MOVIE`
- `CONCERT`
- `OTHER`

### Event Status

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

## 👨‍💼 Organiser Dashboard

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

## 🔄 Customer Booking Workflow

```text
Customer Registration
        ↓
Customer Login
        ↓
Browse Events
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
View My Bookings
        ↓
View Booking Details
        ↓
Cancel Booking
```

---

## 🔄 Organiser Workflow

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

## 🗄️ Database

The application uses PostgreSQL as its relational database.

The database schema is located at:

```text
database/schema.sql
```

### Main Tables

| Table              | Purpose                                 |
| ------------------- | ----------------------------------------- |
| `users`            | Stores customer and organiser accounts  |
| `venues`           | Stores venue information                |
| `seats`            | Stores physical venue seats             |
| `events`           | Stores event information                |
| `event_seats`      | Associates seats with individual events |
| `bookings`         | Stores booking information              |
| `booking_seats`    | Stores seats included in bookings       |
| `waitlists`        | Stores customer waitlist entries        |
| `waitlist_offers`  | Stores waitlist seat offers             |

### Database Features

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

## 🧩 Database Relationship Overview

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

## 📁 Project Structure

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

## 🔌 API

The frontend communicates with the backend through REST API endpoints.

### Production Backend

https://ticket-booking-system-dwny.onrender.com

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Health Check

```text
GET /api/health
```

### Events

```text
GET /api/events
GET /api/events/:id
GET /api/events/:id/seats
```

### Event Management

```text
POST /api/events
PATCH /api/events/:id/open
POST /api/events/:eventId/seats
```

### Booking

```text
POST /api/events/:eventId/hold
POST /api/events/:eventId/confirm
GET /api/my
GET /api/:bookingId
PATCH /api/:bookingId/cancel
```

### Waitlist

```text
POST /api/events/:eventId/waitlist
GET /api/waitlist/my-offers
POST /api/waitlist/offers/:offerId/accept
```

---

## 🚀 Running Locally

### Prerequisites

Install the following:

- Node.js
- npm
- PostgreSQL
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/Thershna/ticket-booking-system.git
cd ticket-booking-system
```

---

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend runs on:

```text
http://localhost:5000
```

Backend environment variables must be configured locally before starting the server.

---

### 3. Database Setup

Create a PostgreSQL database.

Then execute:

```text
database/schema.sql
```

This creates the required tables, ENUM types, constraints, indexes, and relationships.

---

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs using the Vite development server.

---

## 🌍 Deployment

The application is deployed using Render.

### Frontend

React/Vite frontend deployed as a Render Static Site.

### Backend

Node.js/Express backend deployed as a Render Web Service.

### Database

PostgreSQL database hosted on Render.

### Production Architecture

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
                            ↓
                 ┌─────────────────────┐
                 │     PostgreSQL      │
                 │       Render        │
                 └─────────────────────┘
```

---

## 🔒 Environment Variables

Sensitive configuration values are stored using environment variables and are not committed to the GitHub repository.

Typical configuration includes:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
VITE_API_URL
```

Actual secret values are intentionally excluded from this repository.

---

## 🧪 Testing

### Customer Testing

1. Register a customer account.
2. Login.
3. Browse available events.
4. Open an event.
5. View event details.
6. Select available seats.
7. Hold the selected seats.
8. Confirm the booking.
9. Open My Bookings.
10. View booking details.
11. Cancel a booking if required.
12. Test the waitlist when seats are unavailable.

### Organiser Testing

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

## 🔎 API Health Check

The backend provides a health-check endpoint:

```text
GET /api/health
```

Production:

https://ticket-booking-system-dwny.onrender.com/api/health

A successful response confirms that the deployed backend API is running and connected to the database.

---

## 🎯 Project Objectives

The main objectives of this project are:

1. Develop a full-stack online ticket booking platform.
2. Allow customers to browse and book event tickets.
3. Implement visual seat selection.
4. Prevent duplicate seat bookings.
5. Implement temporary seat holding.
6. Provide booking confirmation and cancellation.
7. Implement waitlist functionality.
8. Provide organisers with event and seat management.
9. Provide booking and revenue statistics.
10. Deploy the application using cloud infrastructure.

---

## 📌 Project Status

The core ticket booking system has been implemented and deployed.

### Implemented Modules

- Customer authentication
- Organiser authentication
- Event browsing
- Event management
- Venue management
- Seat configuration
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
- PostgreSQL database integration
- Cloud deployment

---

## 🚀 Future Enhancements

Possible future improvements include:

- Online payment gateway integration
- Advanced event search and filtering
- Discount and coupon management
- Enhanced analytics
- Multiple organiser accounts
- Admin management dashboard
- Advanced notification system

---

## 👩‍💻 Author

**Thershna**

Electronics and Communication Engineering

### GitHub

https://github.com/Thershna

### Project Repository

https://github.com/Thershna/ticket-booking-system

---

## 📜 License

This project was developed as an academic/project implementation demonstrating a full-stack ticket booking system.

---

## 🔗 Project Links

**GitHub Repository:**
https://github.com/Thershna/ticket-booking-system

**Live Frontend:**
https://ticket-booking-frontend-th00.onrender.com

**Backend API:**
https://ticket-booking-system-dwny.onrender.com

**API Health Check:**
https://ticket-booking-system-dwny.onrender.com/api/health
