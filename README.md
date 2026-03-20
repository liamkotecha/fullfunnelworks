# Full Funnel — Private Consulting Portal

A private web portal for Full Funnel's consulting operations. Built with Next.js 14 App Router, TypeScript, MongoDB Atlas, NextAuth v5, SimpleWebAuthn, SendGrid, and Framer Motion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router, `src/` dir) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS (custom navy/cream/gold palette) |
| Database | MongoDB Atlas via Mongoose |
| Auth | NextAuth v5 beta — Passkey (WebAuthn) + Email OTP |
| WebAuthn | `@simplewebauthn/server` + `@simplewebauthn/browser` |
| OTP | `otplib` — 6-digit, 10-minute expiry |
| Email | SendGrid (`@sendgrid/mail`) |
| Animation | Framer Motion |
| Fonts | DM Serif Display + DM Sans |

---

## Prerequisites

- Node.js 18+
- [MongoDB Atlas](https://cloud.mongodb.com) cluster (free tier works)
- [SendGrid](https://sendgrid.com) account with a verified sender address
- A `.env.local` file (see below)

---

## Environment Variables

Copy the example and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `NEXTAUTH_SECRET` | Random secret — run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the app, e.g. `http://localhost:3000` |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender address in SendGrid |
| `WEBAUTHN_RP_NAME` | Relying party name shown in passkey dialog, e.g. `Full Funnel` |
| `WEBAUTHN_RP_ID` | Relying party ID — `localhost` for dev, your domain in prod |
| `WEBAUTHN_ORIGIN` | Full origin, e.g. `http://localhost:3000` (must match browser) |

---

## Local Setup

```bash
# 1. Install dependencies (legacy peer deps required for simplewebauthn + next-auth beta)
npm install --legacy-peer-deps

# 2. Copy env file and fill in values
cp .env.local.example .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root redirects to `/portal/dashboard`.

---

## Route Structure

```
/login                          — Login (passkey + email OTP tabs)
/portal/dashboard               — Overview: stats, blocked projects, recent clients
/portal/clients                 — Client list
/portal/clients/[id]            — Client detail (edit, delete, projects)
/portal/clients/[id]/onboarding — 4-step onboarding wizard
/portal/projects                — Project list (with blocked filter)
/portal/projects/[id]           — Project detail (blocks, milestones, status)
/portal/intake                  — 7-section intake questionnaire
```

All `/portal/*` routes are protected by middleware — unauthenticated users are redirected to `/login`.

---

## MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Whitelist your IP (or `0.0.0.0/0` for dev)
4. Copy the connection string into `MONGODB_URI`

**Recommended indexes** (run in Atlas or Compass):

```js
// Users
db.users.createIndex({ email: 1 }, { unique: true })

// Clients
db.clients.createIndex({ status: 1 })
db.clients.createIndex({ assignedConsultant: 1 })

// Projects
db.projects.createIndex({ clientId: 1 })
db.projects.createIndex({ status: 1 })

// IntakeResponses
db.intakeresponses.createIndex({ clientId: 1 }, { unique: true })
```

---

## Passkey Notes

- Passkeys require a secure origin. `localhost` works in development without HTTPS.
- In production, set `WEBAUTHN_RP_ID` to your bare domain (e.g. `fullfunnel.co`) and `WEBAUTHN_ORIGIN` to `https://fullfunnel.co`.
- Users must first be created in MongoDB (admin flow) before they can register a passkey.

---

## SendGrid Notes

- Verify your sender address/domain in SendGrid before transactional email will deliver.
- All outbound emails use the templates in `src/lib/email/`.
- Set `SENDGRID_FROM_EMAIL` to your verified sender.

---

## Build

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
  app/
    (auth)/login/         — Login page
    (portal)/portal/      — All authenticated portal pages
    api/                  — API routes (auth, clients, projects, intake, passkey, otp)
  components/
    ui/                   — Button, Input, Textarea, Select, Badge, Modal, Skeleton, Toast
    layout/               — Sidebar, TopBar
  lib/
    auth.ts               — NextAuth config
    db.ts                 — MongoDB connection
    otp.ts                — OTP generation/validation
    webauthn.ts           — SimpleWebAuthn registration/authentication
    sendgrid.ts           — Email sending helper
    utils.ts              — cn() and shared utilities
    concept-map.ts        — All intake form content (verbatim from HTML spec)
    email/                — HTML email templates
  models/                 — Mongoose models (User, Client, Project, IntakeResponse, Notification)
  types/                  — Shared TypeScript types and DTOs
  middleware.ts           — Route protection
```
