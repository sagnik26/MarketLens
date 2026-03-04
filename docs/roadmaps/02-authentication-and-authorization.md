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

