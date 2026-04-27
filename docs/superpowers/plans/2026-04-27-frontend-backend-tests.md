# Frontend and Backend Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add meaningful automated test coverage for the Bun frontend and Spring Boot backend, and make `bun test` from the repository root execute both suites.

**Architecture:** Keep frontend coverage focused on pure, stable helper logic that can run under Bun without a browser. Keep backend coverage at the service layer with Mockito-based unit tests so we avoid needing a database for this first pass. Add a small root Bun test harness that imports the frontend behavior tests and shells out to Maven for the Java suite.

**Tech Stack:** Bun test runner, TypeScript, React app utilities, JUnit 5, Mockito, Spring Boot test support, Maven wrapper.

---

### Task 1: Frontend helper coverage

**Files:**
- Create: `apps/web/app/lib/token-cookie.ts`
- Create: `apps/web/app/lib/utils.behavior.ts`
- Modify: `apps/web/app/lib/store.ts`

- [ ] **Step 1: Write the failing test**

Create a Bun behavior test that verifies class merging in `cn()` and token extraction/serialization helpers for the cookie-backed store logic.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test root.test.ts`
Expected: FAIL because the new helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add the helper module and wire `store.ts` to use it.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test root.test.ts`
Expected: PASS for the frontend behavior tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/lib/token-cookie.ts apps/web/app/lib/utils.behavior.ts apps/web/app/lib/store.ts
git commit -m "test: add frontend helper coverage"
```

### Task 2: Backend service coverage

**Files:**
- Create: `apps/backend/src/test/java/com/limpac/backend/service/GoalServiceTest.java`
- Create: `apps/backend/src/test/java/com/limpac/backend/service/CalculationServiceTest.java`

- [ ] **Step 1: Write the failing test**

Add service-level unit tests for default goal creation, validation, metric computation, and decrement guardrails.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && ./mvnw test`
Expected: FAIL because the new service tests do not exist yet.

- [ ] **Step 3: Write minimal implementation**

No production changes should be needed beyond the frontend helper extraction.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && ./mvnw test`
Expected: PASS for backend tests.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/test/java/com/limpac/backend/service/GoalServiceTest.java apps/backend/src/test/java/com/limpac/backend/service/CalculationServiceTest.java
git commit -m "test: add backend service coverage"
```

### Task 3: Root test harness

**Files:**
- Create: `root.test.ts`

- [ ] **Step 1: Write the failing test**

Add a Bun root test that imports the frontend behavior suites and runs `./mvnw test` in the backend workspace.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL until the new root harness exists.

- [ ] **Step 3: Write minimal implementation**

Implement the root wrapper test with a synchronous process spawn and clear failure output.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test`
Expected: PASS and cover both frontend and backend suites.

- [ ] **Step 5: Commit**

```bash
git add root.test.ts
git commit -m "test: wire root bun test across frontend and backend"
```
