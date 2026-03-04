# Implementation Plan: Competitor Timeline, Battlecards, and Tasks

This document describes the implementation plan for three features: **Competitor Timeline**, **Battlecards**, and **Tasks** (AI-suggested tasks with Notion/Jira creation), including UI positioning and technical scope.

---

## 1. UI positioning (verified)

| Feature | Position | Routes |
|---------|----------|--------|
| **Competitor Timeline** | Under **Actions** | `/dashboard/actions/timeline`, `/dashboard/actions/timeline/[competitorId]` |
| **Tasks** | Under **Actions** | `/dashboard/actions/tasks` |
| **Battlecards** | **New section** (top-level nav) | `/dashboard/battlecards`, `/dashboard/battlecards/[competitorId]` |

**Rationale**

- **Timeline** and **Tasks** live under Actions because they are action-oriented flows (view history, create tasks).
- **Battlecards** is a standalone intel section (read-only summary per competitor), so it gets its own nav item like Status, Information, and Insights.

**Nav and hub changes**

- **Sidebar** (`src/components/features/dashboard/DashboardNav.tsx`): Add "Competitor Timeline" and "Tasks" to the Actions group; add "Battlecards" as a new top-level item.
- **Actions index** (`src/app/dashboard/actions/page.tsx`): Add cards for Competitor Timeline and Tasks next to Competitor Radar.

---

## 2. Competitor Timeline

### 2.1 Goal

A chronological view of everything a competitor has done (price changes, feature launches, job signals, review trends) on a single scrollable timeline.

### 2.2 Data

- **Source:** Existing `Change` model (`companyId`, `competitorId`, `competitorName`, `changeType`, `signalType`, `title`, `summary`, `detectedAt`, `pageType`, `url`).
- **New repository method:** `changeRepository.findByCompetitor({ companyId, competitorId, limit })` — filter by `companyId` and `competitorId`, sort by `detectedAt` desc, optional limit (e.g. 100).

### 2.3 Backend

| Item | Location | Description |
|------|----------|-------------|
| Repo method | `src/server/repositories/change.repository.ts` | `findByCompetitor({ companyId, competitorId, limit })` |
| Service | `src/server/services/timeline.service.ts` (new) | `getForCompetitor(companyId, competitorId)` — load competitor + changes, return `{ competitor, changes }` |
| Action | `src/actions/timeline.actions.ts` (new) | e.g. `getTimelineForCompetitorAction(competitorId)` — uses session companyId |

### 2.4 Frontend

| Item | Location | Description |
|------|----------|-------------|
| List/entry | `src/app/dashboard/actions/timeline/page.tsx` | Competitor selector or list linking to timeline by competitor |
| Timeline view | `src/app/dashboard/actions/timeline/[competitorId]/page.tsx` | Vertical timeline: date, changeType badge, title, summary, link; use `ChangeType` / `SOURCE_CHANNEL_LABELS` for labels |
| Components | `src/components/features/timeline/` (new) | e.g. `TimelineView.tsx`, `TimelineItem.tsx` |
| Entry points | Competitor Radar cards, Actions hub | "View timeline" link per competitor |

### 2.5 Multi-tenancy

- All calls use `companyId` from session.
- Repository filters with `companyId` first, then `competitorId`.

---

## 3. Battlecards

### 3.1 Goal

One page per competitor: pricing, key features, positioning, recent moves, and weaknesses from reviews — structured output from existing Change data (no new ingestion).

### 3.2 Data

- **Source:** Same as Timeline — `Change` model + `Competitor` (name, website, logoUrl, channels).
- **Repository:** Reuse `changeRepository.findByCompetitor({ companyId, competitorId, limit })`.

### 3.3 Backend

| Item | Location | Description |
|------|----------|-------------|
| Service | `src/server/services/battlecard.service.ts` (new) | `getForCompetitor(companyId, competitorId)` and optionally `getAllForCompany(companyId)` |
| Aggregation | In battlecard service | Group changes into sections: **Pricing** (`changeType === 'pricing'`), **Features / Changelog** (`feature_add` / `feature_remove` / `changelog`), **Jobs** (job-related), **Reviews** (`review_trend`), **Recent moves** (e.g. last 10 by `detectedAt`) |
| Action | `src/actions/battlecard.actions.ts` (new) | `getBattlecardAction(competitorId)`, `getBattlecardsListAction()` |

### 3.4 Frontend

| Item | Location | Description |
|------|----------|-------------|
| List | `src/app/dashboard/battlecards/page.tsx` | List of competitors with "View battlecard" links |
| Detail | `src/app/dashboard/battlecards/[competitorId]/page.tsx` | One-page battlecard: header (logo, name, website) + sections (Pricing, Features, Jobs, Reviews, Recent moves) |
| Components | `src/components/features/battlecards/` (new) | e.g. `BattlecardView.tsx`, `BattlecardSection.tsx` |
| Nav | DashboardNav | New top-level item "Battlecards" → `/dashboard/battlecards` |

### 3.5 Multi-tenancy

- All queries filtered by `companyId` from session.

---

## 4. Tasks (AI-suggested, Notion/Jira)

### 4.1 Goal

A **Tasks** section under Actions where:

- AI suggests tasks based on insights (and optionally recent changes).
- User can create suggested tasks in **Notion** or **Jira**.

### 4.2 Data and flow

- **Input:** Existing insights (from `insights.service` or Change/Insight data). Insights already have `recommendedActions` (see `src/types/scan.types.ts`, competitor-radar types).
- **AI layer (optional for v1):** Service that takes recent insights/changes and returns a list of **suggested tasks** (title, description, priority, source insight/change id). V1 can surface `recommendedActions` as suggested tasks; v2 can add a Gemini step to normalize/enrich into a standard task shape.
- **Output:** UI list of suggested tasks; each task has actions "Create in Notion" and "Create in Jira". Creation uses existing or new integration (Jira/Linear/Notion) and optionally stores an `ActionItem` (or task record) linking to the source insight/change.

### 4.3 Backend

| Item | Location | Description |
|------|----------|-------------|
| Service | `src/server/services/tasks.service.ts` (new) | `getSuggestedTasks(companyId)` — from insights/changes; optional AI step for task shape |
| Integration | Existing or new | Create ticket in Jira; add Notion if not present (e.g. Composio or direct API) |
| Action | `src/actions/tasks.actions.ts` (new) | `getSuggestedTasksAction()`, `createTaskInJiraAction(taskId, ...)`, `createTaskInNotionAction(taskId, ...)` |
| Optional model | DB | Suggested task or reuse `ActionItem` with status "suggested" vs "created" |

### 4.4 Frontend

| Item | Location | Description |
|------|----------|-------------|
| Tasks page | `src/app/dashboard/actions/tasks/page.tsx` | List of AI-suggested tasks; each row: title, description, priority, source; actions: "Create in Notion", "Create in Jira" |
| Components | `src/components/features/tasks/` (new) | e.g. `SuggestedTasksList.tsx`, `TaskRow.tsx` |
| Nav | DashboardNav (Actions group) | "Tasks" → `/dashboard/actions/tasks` |
| Hub | Actions index | Card linking to Tasks |

### 4.5 Multi-tenancy

- All data and creation scoped by `companyId` from session.

---

## 5. Implementation order

| Step | Feature | Rationale |
|------|---------|-----------|
| 1 | **Competitor Timeline** | Smallest surface: one repo method + one service + routes under Actions; validates `findByCompetitor` for reuse. |
| 2 | **Battlecards** | Reuses `findByCompetitor`; adds aggregation and new section; high perceived value. |
| 3 | **Tasks** | Builds on insights; requires suggested-tasks logic and Notion/Jira creation; add after Timeline and Battlecards. |

---

## 6. Dependencies and risks

- **companyId / auth:** Every new path must take `companyId` from session and pass it as the first filter in all queries.
- **Notion/Jira:** Tasks depends on existing Jira integration and adding Notion (or confirming Notion API/Composio support). If only Jira exists at first, ship Tasks with "Create in Jira" and add Notion in a follow-up.
- **Demo company:** Replace or align with real auth where demo company id is currently hardcoded (e.g. in information/insights services).

---

## 7. File checklist

### New files

- `src/server/repositories/change.repository.ts` — add `findByCompetitor`
- `src/server/services/timeline.service.ts`
- `src/server/services/battlecard.service.ts`
- `src/server/services/tasks.service.ts`
- `src/actions/timeline.actions.ts`
- `src/actions/battlecard.actions.ts`
- `src/actions/tasks.actions.ts`
- `src/app/dashboard/actions/timeline/page.tsx`
- `src/app/dashboard/actions/timeline/[competitorId]/page.tsx`
- `src/app/dashboard/battlecards/page.tsx`
- `src/app/dashboard/battlecards/[competitorId]/page.tsx`
- `src/app/dashboard/actions/tasks/page.tsx`
- `src/components/features/timeline/` (TimelineView, TimelineItem, etc.)
- `src/components/features/battlecards/` (BattlecardView, BattlecardSection, etc.)
- `src/components/features/tasks/` (SuggestedTasksList, TaskRow, etc.)

### Modified files

- `src/components/features/dashboard/DashboardNav.tsx` — add Timeline and Tasks under Actions; add Battlecards as new section
- `src/app/dashboard/actions/page.tsx` — add cards for Timeline and Tasks

---

## 8. Summary

| Feature | Position | Key backend | Key frontend |
|---------|-----------|-------------|--------------|
| Competitor Timeline | Actions | `findByCompetitor` + timeline.service | `/dashboard/actions/timeline`, `/dashboard/actions/timeline/[competitorId]` |
| Battlecards | New section | Same repo + battlecard.service (sections) | `/dashboard/battlecards`, `/dashboard/battlecards/[competitorId]` |
| Tasks | Actions | tasks.service (from insights) + Jira/Notion create | `/dashboard/actions/tasks` |

Implement in order: **Timeline → Battlecards → Tasks**.
