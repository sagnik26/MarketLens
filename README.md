# MarketLens

AI Product Manager intelligence platform for B2B SaaS companies. MarketLens watches the web for competitor moves, pricing changes, job signals, and compliance alerts, and surfaces structured insights with optional Jira/Linear integration.

## Features

- **Competitor Radar** — Monitor competitor pricing, job postings, changelogs, and reviews
- **Compliance Radar** — Track regulatory circulars (e.g. BSE/NSE) for fintech and regulated verticals
- **Dashboard** — Overview, Status, Information, and Insights views
- **Auth** — Sign up, login, JWT (access + refresh), company-scoped multi-tenancy

## Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Optional: Redis (for future rate limiting / caching)

## Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd MarketLens
   npm install
   ```

2. **Environment variables**

   Copy the example env and fill in values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `MONGODB_URI` | Yes | MongoDB connection string; include DB name, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/marketlens` |
   | `JWT_ACCESS_SECRET` | Yes (production) | Min 32 characters; used to sign access tokens |
   | `JWT_REFRESH_SECRET` | Yes (production) | Min 32 characters; used to sign refresh tokens |
   | `TINYFISH_API_KEY` | For scans | API key for TinyFish (Competitor Radar / Compliance scans) |
   | `REDIS_URL` | Optional | e.g. `redis://localhost:6379` |
   | `JWT_ACCESS_EXPIRES_IN` | Optional | Default `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | Optional | Default `7d` |

   Generate JWT secrets locally:

   ```bash
   openssl rand -hex 32
   ```

   Run twice and set as `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

3. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up to create a company and user, then use the dashboard.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **MongoDB** + **Mongoose** for persistence
- **Zod** for validation; **Zustand** for client auth state
- **JWT** (httpOnly cookies) for auth; **bcrypt** for passwords
- **Tailwind CSS**, **Framer Motion**, **Chart.js**

## Deployment (e.g. Vercel)

- Set all env vars in the host dashboard (especially `MONGODB_URI` with the **database name** in the path).
- For MongoDB Atlas, use **Network Access → Allow access from anywhere** (`0.0.0.0/0`) so serverless can connect; protect the DB with a strong password and keep `MONGODB_URI` server-side only.
