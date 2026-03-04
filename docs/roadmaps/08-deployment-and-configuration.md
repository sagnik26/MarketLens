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

