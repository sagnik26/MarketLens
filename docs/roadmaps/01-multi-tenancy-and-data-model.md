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

