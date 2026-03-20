<h1 align="center">GrandStay Hotel Management System</h1>

<p align="center">
  Professional full-stack hotel booking and operations platform with guest authentication,
  room reservations, spa appointments, dining orders, and a dedicated admin control room.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-bf8f2d?style=for-the-badge" alt="Frontend badge">
  <img src="https://img.shields.io/badge/Backend-TypeScript-3178c6?style=for-the-badge" alt="TypeScript badge">
  <img src="https://img.shields.io/badge/API-Express-1f2937?style=for-the-badge" alt="Express badge">
  <img src="https://img.shields.io/badge/Database-SQLite-0f766e?style=for-the-badge" alt="SQLite badge">
  <img src="https://img.shields.io/badge/Auth-JWT-7c3aed?style=for-the-badge" alt="JWT badge">
</p>

## Overview

GrandStay is designed as a polished hospitality platform with separate guest and admin experiences. Guests can register, sign in, browse rooms, reserve stays, book spa services, and place dining orders. Hotel staff can sign into a dedicated admin portal to monitor bookings, food orders, and spa appointments from one operations dashboard.

The project is structured as a professional full-stack application with:

- a dedicated `frontend/` for the guest website and login portals
- a TypeScript `backend/` API for business logic and persistence
- SQLite for local development storage
- separate guest and admin authentication flows
- Windows launch scripts for simple local startup

## Highlights

- Dedicated guest member portal with `Login` and `Register` tabs
- Separate admin login page with a professional operations dashboard
- Room booking flow with availability lookup
- Spa service catalog and appointment scheduling
- Dining menu and food order flow
- Contact, reviews, and payment-related backend endpoints
- JWT-based authentication for guest and admin roles
- Hospitality-style UI inspired by real hotel website patterns

## Screenshots

| Guest Portal | Guest Portal Mobile |
|---|---|
| ![Guest login desktop](screenshots/login-page.png) | ![Guest login mobile](screenshots/login-mobile.png) |

| Admin Portal |
|---|
| ![Admin portal desktop](screenshots/admin-page.png) |

## User Experience

### Guest Experience

- Guests can create a member account from `/login`
- Returning users can sign in and continue their hotel journey
- The public website stays clean and guest-focused

### Admin Experience

- Admins use a dedicated route at `/admin`
- The admin dashboard shows room bookings, food orders, and spa appointments
- Operational access is kept separate from the marketing and booking UI

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite |
| Authentication | JWT |
| Runtime | `tsx` |
| Testing / Verification | smoke test script in `tools/run-final-test.js` |

## Quick Start

### 1. Install backend dependencies

```powershell
npm run backend:install
```

### 2. Start the app

```powershell
npm run dev
```

Or use the Windows launchers:

- `START_SERVER.bat`
- `START_SERVER.ps1`
- `START_PROJECT.bat`

### 3. Open the app

- Public website: `http://localhost:5001`
- Guest login: `http://localhost:5001/login`
- Admin portal: `http://localhost:5001/admin`

## Default Admin Credentials

For local development, the backend seeds a default admin account:

- Email: `admin@grandstayhotel.com`
- Password: `Admin@12345`

These values can be changed in your backend environment configuration.

## Verification

Run the main checks with:

```powershell
npm --prefix backend run typecheck
node tools/run-final-test.js
```

## API Highlights

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Rooms and Bookings

- `GET /api/rooms`
- `GET /api/bookings`
- `POST /api/bookings`

### Spa

- `GET /api/spa/services`
- `GET /api/spa/availability`
- `POST /api/spa/bookings`
- `GET /api/spa/admin/bookings`

### Dining

- `GET /api/food/menu`
- `POST /api/food/orders`
- `GET /api/food/admin/orders`

### Other Modules

- contact management
- reviews
- payment flows

## Project Structure

```text
frontend/
  admin/               Admin login + operations dashboard
  login/               Guest login + registration portal
  images/              Visual assets and hospitality imagery
  scripts/             Frontend runtime scripts
  styles/              Shared and portal-specific styles
  index.html           Public website

backend/
  src/config/          Environment and configuration
  src/db/              Database bootstrap
  src/lib/             Data access and domain utilities
  src/middleware/      Auth and error handling
  src/routes/          API route modules
  src/types/           Shared domain types
  src/utils/           Helpers and utilities
  data/                Static seed/catalog data
  storage/             Local SQLite database

scripts/windows/       Windows startup helpers
tools/                 Smoke test scripts
screenshots/           README assets
```

## Notes

- SQLite is used for local persistence and development simplicity
- `backend/storage/` and `backend/.env` are intentionally ignored from git
- The project keeps the guest experience and admin operations flow clearly separated

## GitHub About Text

If you want to reuse the short GitHub repository description:

> Professional full-stack hotel booking platform with guest login, admin dashboard, room reservations, spa appointments, dining orders, TypeScript backend, and SQLite persistence.
