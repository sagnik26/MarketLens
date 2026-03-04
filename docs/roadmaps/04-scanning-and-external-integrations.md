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

