# Ramadan & Prayer Tracker Bot (Uzbekistan)

Production-ready Telegram bot built with Node.js LTS, Telegraf, MongoDB (Mongoose), polling/webhook mode, and node-cron.

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
- `BOT_MODE` (`polling` for IP/VPS without HTTPS domain, or `webhook`)
- `PORT` (default: `3002`)
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

## Deploy on VPS (GitHub + port 3002)

```bash
sudo apt update
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

git clone https://github.com/kinddevs2024/GlobalMuslims.git
cd GlobalMuslims
npm install

cp .env.example .env
```

Set in `.env`:

- `PORT=3002`
- `BOT_MODE=polling`
- `BOT_TOKEN=...`
- `MONGODB_URI=...`
- `RAMADAN_START=2026-02-18`

Check port and open firewall:

```bash
ss -ltnp | grep :3002 || true
sudo ufw allow 3002/tcp
sudo ufw status
```

Start with PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Health check:

```bash
curl http://YOUR_SERVER_IP:3002/health
```

## Health check

`GET /health` returns:

```json
{ "ok": true }
```
