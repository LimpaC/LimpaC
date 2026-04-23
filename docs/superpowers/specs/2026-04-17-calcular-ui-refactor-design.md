# calcular.tsx UI Refactor Design

**Goal:** Refine the `/calcular` dashboard so the text hierarchy feels more premium, key metrics animate with `NumberFlow`, and the page uses softer motion and stronger typography without changing backend behavior.

**Scope**
- Keep the existing calculation, goal, increment, and decrement flows intact.
- Rework only the presentation layer of `apps/web/app/routes/calcular.tsx`.
- Add a small global typography/motion pass in `apps/web/app/app.css`.
- Keep new dependencies limited to `@number-flow/react` and a refined variable font.

**Design direction**
- Use a quieter, more editorial layout with clearer sections and more whitespace.
- Replace static large numeric labels with animated `NumberFlow` values for the primary KPI, equivalence blocks, and goal display.
- Tighten spacing and hierarchy: stronger hero, smaller labels, better line lengths, and consistent number alignment.
- Use easing-based entrance animations so cards and hero content settle in instead of appearing abruptly.
- Keep the existing rose accent, but reduce saturation and let neutrals carry most of the surface weight.

**Typography**
- Use `Manrope Variable` for headings and interface hierarchy, while keeping `Geist Variable` for body copy and controls.
- Add tabular numerals and tighter display tracking for KPI text.
- Reduce all-caps noise where possible and favor sentence case for most labels.

**Motion**
- Add subtle fade/translate-in transitions on mount for the hero and cards.
- Use smooth easing for buttons, cards, and modal controls.
- Respect reduced-motion defaults where possible, especially for `NumberFlow`.

**Files**
- Modify: `apps/web/app/routes/calcular.tsx`
- Modify: `apps/web/app/app.css`
- Modify: `apps/web/package.json`
- Modify: `bun.lock`

**Validation**
- Run typecheck and build for `apps/web`.
- Verify the route still loads, calculations still submit, and modal actions still update state.
