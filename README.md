 # Ramadan & Prayer Tracker Bot (Uzbekistan)

Production-ready Telegram bot built with Node.js LTS, Telegraf, MongoDB (Mongoose), webhook mode, and node-cron.

## Features

- `/prayer` state-based dynamic UI with single message + inline keyboard
- Prayer toggling via `callback_query` and `editMessageText` (no duplicate message on click)
- Duplicate marking prevention for prayers
- Ramadan day auto-calculation from `RAMADAN_START`
- `/calendar` command with dynamic statuses:
  - ✅ Tutildi
  - ❌ Qoldirildi
  - 🟡 Bugun
  - 🔒 Kelgusi kun
- Fasting reminders:
  - After Fajr: "Bugungi ro‘zaga niyat qildingizmi?"
  - After Maghrib: "Bugungi ro‘zani to‘liq tutdingizmi?"
- Auto mark unanswered pending days as `missed` at 23:59 (Asia/Tashkent)

## Architecture

```txt
src/
  config/
  models/
  services/
  controllers/
  keyboards/
  utils/
  scheduler/
  bot.js
  server.js
```

## Environment

1. Copy `.env.example` to `.env`
2. Fill values:

- `BOT_TOKEN`
- `MONGODB_URI`
- `WEBHOOK_DOMAIN` (public HTTPS domain)
- `WEBHOOK_PATH` (e.g. `/telegram/webhook`)
- `RAMADAN_START` (format: `YYYY-MM-DD`)
- `APP_TIMEZONE=Asia/Tashkent`

Optional cron settings:

- `FAJR_CRON`
- `MAGHRIB_CRON`
- `MISSED_CHECK_CRON`

## Install & Run

```bash
npm install
npm start
```

## Webhook setup example

If:

- `WEBHOOK_DOMAIN=https://bot.example.uz`
- `WEBHOOK_PATH=/telegram/webhook`

Bot will register webhook URL:

`https://bot.example.uz/telegram/webhook`

## VPS deployment notes

- Run behind Nginx/Caddy with TLS
- Keep process alive with PM2/systemd
- Restrict MongoDB network access
- Store secrets only in `.env` (never in code)
- Use UTC-safe backups for MongoDB

## Health check

`GET /health` returns:

```json
{ "ok": true }
```
