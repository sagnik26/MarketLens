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

