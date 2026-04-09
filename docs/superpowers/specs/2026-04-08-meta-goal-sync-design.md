# Meta + Economia Sync Spec

## Context

The page `apps/web/app/routes/calcular.tsx` currently uses hardcoded goal values, always starts with local cards default, and posts calculations directly without loading the latest persisted dashboard state first. The backend currently supports creating calculations and listing history by token, but does not persist a dedicated goal entity and does not provide a latest-state endpoint for the dashboard.

This spec defines the target behavior and implementation shape for goal management, cards increment flow, and full backend-state synchronization.

## Product requirements

1. Replace header `ENTRAR` with a cog icon.
2. Cog opens a shadcn dropdown.
3. Dropdown item opens a modal with slider to set `Meta`.
4. Meta must be saved in backend linked to the identity resolved by token/user.
5. Every economia update in `calcular.tsx` must refresh and match goal/progress from backend.
6. Cards input behavior:
   - If no previous backend input exists: keep current direct input behavior.
   - If previous backend input exists: show increment flow with modal asking quantity to add.
7. Always load latest backend data first and keep UI aligned with persisted values.

## Existing codebase findings

- Frontend route: `apps/web/app/routes/calcular.tsx`
- Token source: `apps/web/app/lib/store.ts` and hydration in `apps/web/app/root.tsx`
- Backend calculations:
  - Controller: `apps/backend/src/main/java/com/limpac/backend/controller/CalculationController.java`
  - Service: `apps/backend/src/main/java/com/limpac/backend/service/CalculationService.java`
  - Entity: `apps/backend/src/main/java/com/limpac/backend/entity/Calculation.java`
  - Repository: `apps/backend/src/main/java/com/limpac/backend/repository/CalculationRepository.java`
- Backend user token lookup:
  - Entity: `apps/backend/src/main/java/com/limpac/backend/entity/User.java`
  - Repository: `apps/backend/src/main/java/com/limpac/backend/repository/UserRepository.java`

## Architecture changes

### 1) New persisted goal model

Add `Goal` as a separate entity linked 1:1 to user identity.

Fields:

- `id` (UUID)
- `targetCo2e` (double, negative values allowed)
- `updatedAt` (timestamp)
- `manager` (`User`, unique relation)

Rationale:

- Goal is user/device preference, not a calculation snapshot.
- Enables direct goal updates without mutating history.

### 2) Dashboard latest-state API

Add a single source endpoint to bootstrap the page:

`GET /dashboard/state?token=<uuid>`

Response:

- `goal`: persisted target and metadata
- `latestCalculation`: latest snapshot or `null`
- `hasHistory`: boolean
- `progressPct`: computed against latest impact and current goal

Rationale:

- Frontend can render deterministically from one response.
- Eliminates hardcoded goal constants and initial blind post.

### 3) Goal write API

`PUT /goal`

Body:

- `token`
- `targetCo2e`

Behavior:

- Upsert goal for token owner.
- Return normalized goal payload.

### 4) Calculation increment API

Add increment endpoint for the existing-data flow:

`POST /calculation/increment`

Body:

- `token`
- `addCards`

Behavior:

- Resolve token owner.
- Read latest calculation.
- Compute new absolute cards as `latest.cards + addCards`.
- Create new calculation snapshot.
- Return normalized dashboard state payload.

Rationale:

- Preserves history.
- Avoids race conditions from client-side total math.
- Matches required "how many cards to add" UX.

## Frontend specification (`apps/web/app/routes/calcular.tsx`)

### Header updates

- Replace `ENTRAR` button with `Settings` cog icon button.
- Use shadcn `DropdownMenu`.
- Add item `Ajustar Meta` that opens shadcn `Dialog` with slider.

### Goal modal behavior

- Slider range should represent allowed target range for CO2e goals.
- Show selected value preview in modal.
- On save:
  1. call `PUT /goal`
  2. refresh dashboard state from backend (or use returned normalized payload)
  3. close modal

### Initial data loading

On token ready:

1. fetch `GET /dashboard/state`
2. set local states from response
3. do not auto-create a new calculation on load

### Cards section behavior

- Branch by `hasHistory` from backend:
  - `false`: keep current numeric input and `Atualizar Economia` submit.
  - `true`: disable direct overwrite flow and show:
    - current cards total
    - `Adicionar cartões` button
    - modal with numeric field `Quantidade a adicionar`
    - submit to `POST /calculation/increment`

### Economia update behavior

After any calculation write (`POST /calculation` or `/calculation/increment`):

- use normalized response (or immediately refetch `GET /dashboard/state`)
- update:
  - cards base
  - impact values
  - goal value
  - progress
- ensure displayed meta always matches backend persisted goal.

### UI component additions

Add missing shadcn components in `apps/web/app/components/ui/`:

- `dropdown-menu.tsx`
- `dialog.tsx`
- `slider.tsx`

## Backend specification (`apps/backend`)

### New files

- `entity/Goal.java`
- `repository/GoalRepository.java`
- `service/GoalService.java`
- `controller/GoalController.java`
- DTOs under `dto/` for goal writes and state reads
- `controller/DashboardController.java` (if state endpoint is separated)

### Updated files

- `repository/CalculationRepository.java`
  - add latest lookup method ordered by `createdAt desc`
- `service/CalculationService.java`
  - add increment method
  - expose normalized payload assembly helper
- `controller/CalculationController.java`
  - add `/calculation/increment`

### Data consistency rules

- token must resolve to exactly one user/manager.
- goal upsert is idempotent by owner.
- increment rejects non-positive adds.
- state endpoint always returns current goal and latest calculation in the same payload.

## DTO contracts

### `PUT /goal` request

```json
{
  "token": "uuid",
  "targetCo2e": -9000
}
```

### `GET /dashboard/state` response

```json
{
  "goal": {
    "targetCo2e": -9000,
    "updatedAt": "2026-04-08T12:00:00Z"
  },
  "latestCalculation": {
    "id": "uuid",
    "cards": 500,
    "co2Impact": -8450.0,
    "plasticSaved": 123.4,
    "treesPreserved": 10,
    "waterSaved": 4567.0,
    "energySaved": 890.0,
    "createdAt": "2026-04-08T12:10:00Z"
  },
  "hasHistory": true,
  "progressPct": 93.89
}
```

### `POST /calculation/increment` request

```json
{
  "token": "uuid",
  "addCards": 25
}
```

### Calculation write response

Use the same normalized shape as `GET /dashboard/state` to keep frontend simpler.

## Validation and error behavior

- `400` for malformed token/value payload.
- `401` when token has no linked user.
- `404` only for explicit not-found resources if needed.
- `422` for invalid domain values:
  - `targetCo2e` out of allowed range
  - `addCards <= 0`

Frontend should show existing error area in the card for failed writes and keep last known valid state.

## Migration strategy

Current backend uses `spring.jpa.hibernate.ddl-auto=update`.

Target:

- Add schema for `goal` table and unique FK to `users`.
- Add index for latest calculation lookup (`manager_id`, `created_at desc`).
- Keep existing calculation history data unchanged.

## Acceptance criteria

1. Header no longer shows `ENTRAR`; shows cog dropdown.
2. User can open meta modal, move slider, save, and see persisted goal after refresh.
3. Page bootstraps from backend latest state without creating new calculation automatically.
4. If no history exists, cards input remains direct numeric + update button.
5. If history exists, user sees increment button and can add cards via modal.
6. After any economy update, displayed goal/progress/cards/impact values are synchronized with backend payload.
7. Goal shown in UI always equals latest persisted goal returned by backend.

## Out of scope

- Design system refactor outside this route.
- Full authentication redesign beyond token-based identity currently used.
- Historical goal timeline.
