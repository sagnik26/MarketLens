# Server

Backend-only code. Used by **Route Handlers** (`app/api/`) and **Server Actions** (`actions/`).

- **`api/`** — Route handler wrapper, HTTP errors, response helpers, auth/rateLimit/validate middleware
- **`lib/`** — db, redis, logger, auth, tinyfish client and goals
- **`services/`** — Business logic (scan, change-detection, enrichment, action, users, auth, email)
- **`repositories/`** — DB access (scan, competitor, users, sessions)
- **`models/`** — Mongoose schemas and models

**Import from:** `@/server/services/...`, `@/server/api/...`, `@/server/repositories/...`, `@/server/models/...`, `@/server/lib/...`

Do not import server code from client components. Keep `app/`, `components/`, `hooks/`, `stores/`, `actions/` (and shared `lib/utils`, `lib/validations`, `types/`, `config/`) as the frontend surface.
