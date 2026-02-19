# Global Muslims — Worship & Ramadan Tracking System (Web Module)

This module implements the new product specification as a full-stack MVP while keeping the existing Telegram bot untouched.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- MongoDB
- Mongoose
- JWT authentication

## Project Structure

```txt
web/
  app/
    api/
      analytics/summary/route.ts
      auth/login/route.ts
      auth/logout/route.ts
      auth/me/route.ts
      auth/register/route.ts
      prayer/today/route.ts
      profile/route.ts
      profile/export/route.ts
      ramadan/today/route.ts
    analytics/page.tsx
    dashboard/page.tsx
    profile/page.tsx
  components/
  lib/
  prisma/schema.prisma
```

## Database Models

Defined in Mongo collections via `lib/mongoModels.ts`:

- `User`
- `DailyPrayerLog`
- `RamadanLog`
- `StatisticsCache`

## Business Rules Implemented

- Only authenticated users can access tracking endpoints.
- Prayer logs are unique per day per user (`userId + dateKey`).
- Ramadan logs are unique per day per user.
- Date keys are normalized by user timezone (`timezone` query/body value).
- Weekly/monthly/yearly analytics include completion, missed prayers, and streaks.

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Prayer & Ramadan

- `GET /api/prayer/today`
- `PUT /api/prayer/today`
- `GET /api/ramadan/today`
- `PUT /api/ramadan/today`

### Analytics

- `GET /api/analytics/summary?scope=weekly|monthly|yearly&timezone=...`

### Profile

- `GET /api/profile/export`
- `DELETE /api/profile`

## Environment

1. Copy env file:

```bash
cp .env.example .env
```

1. Fill values:

- `MONGODB_URI=mongodb://127.0.0.1:27017/ramadan_tracker`
- `JWT_SECRET=...`
- `JWT_EXPIRES_IN=7d`

## Run

```bash
npm install
npm run dev
```

## Security Notes

- Password hashing via `bcryptjs`
- JWT is stored in `httpOnly`, `secure`, `sameSite=strict` cookie
- Basic rate limiting for auth endpoints
- Use HTTPS in production
