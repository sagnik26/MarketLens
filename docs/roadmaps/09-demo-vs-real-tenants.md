## 9. Demo vs Real Tenants

### 9.1 Demo workspace separation (**P1**)

**Goal:** Keep demo data isolated from production tenants.

**Todos:**

- [ ] Keep the existing demo company id and seed user for demos.
- [ ] Add a flag on `Company` (`isDemo: boolean`) to differentiate.
- [ ] Ensure analytics/production metrics exclude `isDemo = true` companies if necessary.

