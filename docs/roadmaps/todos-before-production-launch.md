## MarketLens – Production Readiness Checklist

This document outlines the key work items required to take the current MarketLens codebase from a strong MVP to a production‑grade, multi-tenant SaaS.

The checklist is organized by area, with **priority** tags:

- **P0** – must have before real customers
- **P1** – important for reliability/scale, can follow shortly after launch
- **P2** – nice-to-have / later hardening

---

## 1. Multi‑tenancy & Data Model

### 1.1 First‑class Company model (**P0**)

**Goal:** Make `Company` an explicit entity instead of only an ObjectId on other models.

**Todos:**

- [ ] Create `Company` model (e.g. `CompanyModel`) with:
  - `name`, `plan`, `createdAt`, `updatedAt`
  - Metadata like `ownerUserId`, billing info placeholder.
- [ ] On **signup**, create:
  - A new `Company` document.
  - A new `User` linked to that company (`companyId = company._id`).
- [ ] Update any references to ObjectId-only companyIds in code/docs to use the `Company` model conceptually.

### 1.2 Tenant isolation checks (**P0**)

**Goal:** Guarantee no data leaks across companies.

**Todos:**

- [ ] Confirm **every** repository method takes `companyId` and applies it as the first filter.
- [ ] Confirm **every service** that fetches data takes `companyId` and passes it to repositories.
- [ ] Confirm **all API routes** that read/write company data:
  - [ ] Use `authenticate` middleware.
  - [ ] Read `companyId` from `x-company-id` (set by middleware) or via `getServerAuthContext` (for server components/actions).
- [ ] Add a short test matrix (manual or automated) to ensure:
  - User A (Company A) cannot read competitors / scans / changes belonging to Company B.

---

## 2. Authentication & Authorization

### 2.1 Harden secrets & env handling (**P0**)

**Goal:** Avoid using weak defaults in production.

**Todos:**

- [ ] Update `config/env.ts` to:
  - [ ] Require `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` **unconditionally** in `production`.
  - [ ] Optionally allow dev fallbacks only in `development` / `test`.
- [ ] Update deployment config (Vercel / Docker / etc.) to set strong, 32+ char secrets.

### 2.2 Refresh token strategy (**P1**)

**Goal:** Move from “single refresh token per user” to a safer model.

**Todos:**

- [ ] Extend `User` model or add `Session` model to track refresh tokens per device:
  - `userId`, `companyId`, `refreshTokenHash`, `userAgent`, `createdAt`, `lastUsedAt`.
- [ ] On login:
  - [ ] Create a new session row and store its id in the refresh token payload.
- [ ] On logout:
  - [ ] Invalidate that session’s refresh token (not just nulled on user).
- [ ] Optionally support:
  - [ ] “Log out from all devices” (delete all sessions for a user).

### 2.3 Role-based access control (**P1**)

**Goal:** Use roles (`admin`, `member`) to guard privileged operations.

**Todos:**

- [ ] Audit routes that should be **admin-only**, e.g.:
  - Managing company-level settings.
  - Viewing billing / plan.
- [ ] Wrap those with `authorize("admin")`.
- [ ] Add a simple role display to `/dashboard/profile` (already partially there).

---

## 3. Validation & API Contracts

### 3.1 Request validation with Zod (**P0**)

**Goal:** Ensure all incoming data is validated before hitting services.

**Todos:**

- [ ] For each important endpoint (auth, competitors, scans, actions, information, insights):
  - [ ] Define Zod schemas for request body, params, and query.
  - [ ] Validate **inside the route handler** before calling services:
    - `/api/v1/auth/login`, `/auth/signup`, `/auth/refresh`
    - `/api/v1/competitors`, `/competitors/[id]`
    - `/api/v1/scan/run`, `/scan/run/stream`
    - `/api/v1/insights/summary`
    - `/api/v1/information/competitors`
- [ ] Ensure consistent error format:
  - 422 with `error.code = "VALIDATION_ERROR"` and a clear message.

### 3.2 Response contracts (**P1**)

**Goal:** Document and stabilize API responses.

**Todos:**

- [ ] For each public API route, define a TS type for its response shape.
- [ ] Make sure `apiSuccess` / `apiError` always match that shape.
- [ ] Add a small “API contracts” doc section for internal consumers.

---

## 4. Scanning & External Integrations

### 4.1 Rate limiting & abuse protection (**P1**)

**Goal:** Prevent misuse of Tinyfish scans and backend APIs.

**Todos:**

- [ ] Implement IP and/or user-based rate limit middleware on:
  - `/api/v1/scan/run`
  - `/api/v1/scan/run/stream`
- [ ] Use Redis (already present) for counting, with short TTL windows (e.g. 15 min).

### 4.2 Error handling & retries for Tinyfish (**P1**)

**Goal:** Make scans resilient to transient failures.

**Todos:**

- [ ] Wrap Tinyfish calls (`runSSE`, `runSSEWithCallbacks`) with:
  - [ ] Timeouts.
  - [ ] Retries with backoff for transient errors.
- [ ] Clearly differentiate:
  - [ ] “Page failed” vs “entire scan failed” and propagate into `ScanRun.status`.

---

## 5. Observability

### 5.1 Logging (**P1**)

**Goal:** Standardize logs and ensure sensitive data is scrubbed.

**Todos:**

- [ ] Ensure `logger` is used instead of `console` everywhere in server code.
- [ ] Verify redaction:
  - No passwords, tokens, or cookies in logs.
- [ ] Optionally integrate with:
  - Datadog / Loki / CloudWatch / Logflare.

### 5.2 Error tracking (**P1**)

**Goal:** Capture unhandled errors and frontend exceptions.

**Todos:**

- [ ] Integrate Sentry (or similar) in:
  - Next.js app for client/server errors.
  - API routes for unhandled exceptions.
- [ ] Add `captureException` in:
  - Root `error.tsx` / `global-error.tsx`.

---

## 6. Testing & CI

### 6.1 Automated tests (**P0/P1**)

**Goal:** At least basic coverage of core flows.

**Todos:**

- [ ] Unit tests:
  - `auth.service` (login/refresh/logout).
  - `competitor.service`.
  - `scan.service` (mapping Tinyfish responses to Changes).
- [ ] Integration tests:
  - API routes for auth, competitors, scans, insights.
- [ ] Smoke tests:
  - Simple e2e scenario: login → add competitor → run scan → see change in Insights.

### 6.2 CI pipeline (**P0**)

**Goal:** Block bad code from reaching production.

**Todos:**

- [ ] Configure CI (GitHub Actions, etc.) to run:
  - `npm run lint`
  - `npm run build`
  - `npm test` (when tests added)
- [ ] Make CI required on `main`/`production` branches.

---

## 7. Frontend UX & Security

### 7.1 Auth UX polish (**P1**)

**Goal:** Make login/signup flows robust and clear.

**Todos:**

- [ ] Add clear error messages for:
  - Invalid credentials.
  - Locked/inactive user.
  - Server errors.
- [ ] Confirm redirects:
  - After login → `/dashboard`.
  - After logout → `/`.
- [ ] Consider a “already logged in” check on `/login` that redirects to `/dashboard` if a valid access token is present.

### 7.2 Access control in UI (**P2**)

**Goal:** Hide UI elements the user can’t use.

**Todos:**

- [ ] Read role on client (`/api/v1/users/me`) and:
  - Hide admin-only controls for `member` role.
- [ ] Avoid exposing “Scan” / “Add competitor” buttons if company is over plan limits (once plans exist).

---

## 8. Deployment & Configuration

### 8.1 Environment configuration review (**P0**)

**Goal:** Ensure all required env vars are set and documented.

**Todos:**

- [ ] Document required env variables:
  - `MONGODB_URI`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `TINYFISH_API_KEY`
  - `REDIS_URL` (if used in production)
- [ ] Provide a `.env.example` with comments.

### 8.2 Database & indexing (**P1**)

**Goal:** Ensure Mongo indices match access patterns.

**Todos:**

- [ ] Confirm indexes for:
  - `companyId + createdAt` on time-series collections (changes, scans).
  - `companyId + email` on users (already present).
  - `companyId + name` on competitors.
- [ ] Add any missing compound indexes where queries filter/sort on multiple fields.

---

## 9. Demo vs Real Tenants

### 9.1 Demo workspace separation (**P1**)

**Goal:** Keep demo data isolated from production tenants.

**Todos:**

- [ ] Keep the existing demo company id and seed user for demos.
- [ ] Add a flag on `Company` (`isDemo: boolean`) to differentiate.
- [ ] Ensure analytics/production metrics exclude `isDemo = true` companies if necessary.

---

## 10. Prioritization for first external users

For a small set of design partners or early customers, focus on:

- **P0 items first:**
  - Company model & tenant isolation.
  - Env & secret hardening.
  - Request validation on key APIs.
  - Basic tests + CI.
- Then **P1 items** in this order:
  - Rate limiting + Tinyfish resilience.
  - Logging & error tracking.
  - Role-based access control.

