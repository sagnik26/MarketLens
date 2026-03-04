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

