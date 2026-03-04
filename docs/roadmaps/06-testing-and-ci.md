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

