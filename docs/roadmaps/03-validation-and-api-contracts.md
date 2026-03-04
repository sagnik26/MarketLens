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

