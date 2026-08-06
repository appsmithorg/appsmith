# MCP M6 — Canvas awareness: overlap prevention, container fit, modal discipline

Date: 2026-07-16
Status: APPROVED WITH CONDITIONS — design council 2026-07-16 (senior-architect,
security-reviewer, product-planner: all APPROVE WITH RISKS). All conditions folded in below,
marked [COUNCIL]. Security + architect re-review of the code is mandatory before commit.
Origin: user report with screenshot — a table widget written over a tabs widget's region in a
real app. Root cause: the MCP writes DSL directly, bypassing the editor's reflow engine. The
lint DETECTS sibling overlap post-write (`lint.ts:191-216`, surfaced in inspect_page + inline
diagnostics) but nothing PREVENTS it: `patch_widgets` `move` writes any `position` blind and
no occupancy model exists. Second ask: prevent modal-on-modal stacking.

Scope: entirely inside `app/client/packages/mcp/src/builder/` + tool wiring in `app.ts`.
No platform/editor changes. NOT in scope: constraining human drag-edits in the editor (the
delta gate below still protects subsequent MCP mutations on human-messed pages).

## Invariants preserved

Closed vocabulary unchanged — this milestone adds geometry/structure validation and repair,
no new emission surface. All repairs are deterministic grid math; every automatic adjustment
is reported to the agent in the result.

## A. Occupancy model — new `builder/occupancy.ts`

Per-canvas grid index (a page, container body, tab panel, and modal body are each one canvas).
Over a canvas's children rects `{topRow, bottomRow, leftColumn, rightColumn}`:

- `collisions(children, rect, excludeNames)` → colliding widget names — EXTRACT the intersect
  predicate from the overlap lint (`rangesOverlap`, half-open `aStart < bEnd && bStart < aEnd`;
  edge-touching is not overlap); single shared implementation, extraction step must be
  behavior-identical for lint. [COUNCIL: architect]
- `nearestFreePosition(children, size, preferred)` → deterministic pushdown: try `preferred`;
  while colliding, topRow := (lowest colliding bottomRow + 1). Column clamp uses the CANVAS'S
  OWN column count (per-canvas `rightColumn`-derived, NOT the global 64 — inner canvases have
  their own widths). [COUNCIL: architect]
- Numeric hygiene [COUNCIL: security]: every rect read from live DSL passes `isNumber`
  (non-numeric/NaN rects are skipped with a note, never computed with); every written value is
  `Number.isSafeInteger` and clamped to a MAX_ROW constant. Fix `moveToPosition`'s existing
  unguarded `bottomRow - topRow` span math while extracting. Termination: with finite guarded
  numbers topRow strictly increases past a collider each iteration → ≤ N iterations.
- Detached widgets (modals: `detachFromLayout` children of the root canvas) are EXCLUDED from
  occupancy, pushdown, and gate pair-sets — they are overlays, not in-flow; counting their
  nominal rects would false-reject unrelated edits and waste repair space. The overlap lint is
  updated to skip them too (a deliberate, tested lint change — removes a false-warning class,
  applied as its own step after the behavior-identical extraction). [COUNCIL: architect+product]
- Repaired widgets keep their mobile row mirrors (`mobileTopRow`/`mobileBottomRow`) in sync
  with the new desktop rows, matching `stampWidget`'s seeding. [COUNCIL: architect]

## B. Collision-aware `move` — `builder/editPatch.ts`

- `move` gains optional `strict?: boolean` (default false).
- Explicit `position`: target rect = widget's current size at new topRow/leftColumn.
  - Collision + default: REPAIR — place at `nearestFreePosition`, record
    `{ requestedPosition, position: <actual> }` in `changes` AND surface the adjustment as a
    top-level `note` in the tool result (agents skim `changes`; they read notes).
    [COUNCIL: product]
  - Collision + `strict: true`: reject with the colliding widget names AND the nearest free
    position, so one retry can succeed.
- Reparent (`parent`): landing position becomes occupancy-aware (today it silently keeps the
  old coordinates in the new canvas — frequently unsafe). This is a deliberate semantic change:
  the resulting position is always recorded in `changes` + patchSpec documents it.
  [COUNCIL: architect]
- Same fit rules as (D) when the destination is a bounded canvas.

## B2. New `resize` patch operation [USER REQUEST, closes council's "no resize op" dead end]

`{ kind: "resize", name, rows?, columns?, strict?: boolean }` — grid units, integers ≥ 1,
at least one of rows/columns, clamped to MAX_ROW / the parent canvas's column count.

- In-flow widgets: bottomRow = topRow + rows; rightColumn = leftColumn + columns. Growing into
  occupied cells: default cascade-pushes the colliding below-siblings (same cascade as D);
  `strict: true` rejects with colliders. Width growth that exceeds the canvas rejects with the
  available columns (no horizontal reflow in v1).
- Containers/forms/tabs: shrinking below the children's occupied extent rejects with the
  executable minimum ("smallest rows that fit the children: N"). Growing follows D's cascade.
- MODAL_WIDGET: rendered height is a px prop, not grid rows — `rows` is translated
  (rows × rowHeightPx) into the vetted height prop, keeping one vocabulary. Width via the
  vetted modal width prop equivalently, if the DSL supports it; otherwise rows only in v1.
- Mobile row mirrors kept in sync (as in A). All outputs server-computed integers.
- This gives clipped/overflow diagnostics an EXECUTABLE suggestedFix (grow the parent), which
  the council flagged as a dead end when the vocabulary had no resize.

## C. Delta overlap gate — INSIDE commitLayout [COUNCIL: architect]

commitLayout is the single write choke point for edit_page, patch_widgets, AND wire_event, and
already holds both currentDsl and newDsl — the gate lives there (no per-handler duplication;
wire_event needs no exemption since a pure diff is a no-op on it; any future layout tool is
covered for free; the gate also double-checks the repair logic itself).

- Compute overlapping sibling pairs per canvas before and after (shared intersect helper),
  keyed by NAME PAIR (names are page-unique; the vocabulary has no rename). Name-pair keys mean
  two already-overlapping widgets reparented together stay "pre-existing" — carried mess warns,
  never gates. Pinned by a test. Multi-op patches diff initial-vs-final. [COUNCIL: architect]
- A pair present after but not before → reject: `code: "overlap_introduced"`, the pairs
  (names truncated, pair count capped in the message [COUNCIL: security]), and a
  `suggestedFix` payload (F).
- Detached (modal) rects excluded per A. build_application bypasses commitLayout; its artifact
  keeps the cheap invariant check via the existing lint.

## D. Container fit — WITH cascade repair [COUNCIL: architect, blocking condition]

Growing a container changes its own rect on its PARENT canvas — which can itself introduce an
overlap the gate would reject; `applyEdit` already grows containers today, so without cascade
the currently-working add-inside-container flow starts failing under the gate.

- Grow set: CONTAINER_WIDGET + FORM_WIDGET + TABS_WIDGET (all grow in today's compile path;
  rejecting tabs would regress working behavior). Auto-grow bottomRow to fit; never shrink.
- CASCADE: after growing a widget, push its below-siblings down via nearestFreePosition,
  recursively up the ancestor chain; every adjustment recorded in `changes` + a top-level note.
  The gate runs on the final cascaded result.
- MODAL body overflow: WARNING, not reject (the runtime scrolls: shouldScrollContents=true) —
  with an executable suggestedFix that resizes the modal via B2. [COUNCIL: architect+product]
- The existing clipped-container lint stays as the detection twin, now with a resize
  suggestedFix.

## E. Modal discipline

Two independent mechanisms (Appsmith modals are page-level overlays, so DSL nesting alone
misses stacking):

1. **Structural**: a modal may not exist anywhere in another modal's subtree.
   - build/edit spec: compile-time recursive check on the modal arm's children (any depth,
     incl. modal-in-container-in-modal) → compile error.
   - patch `move`: reject reparenting a modal (or a subtree containing one) under a modal's
     canvas.
2. **Event graph** (`wire_event` + lint): build the modal-open graph from trigger bindings.
   Attribute each event to its nearest enclosing MODAL_WIDGET ancestor (or the page).

   **Close-aware edges [COUNCIL: product+architect, blocking condition]:** an edge whose
   binding ALSO closes the enclosing host modal (`closeModal('<host>')` in the same statement
   list / onSuccess chain) is a TRANSITION, not stacking — it does not increase depth and does
   not participate in cycle detection. This keeps sequential wizards (Step1 → close+open
   Step2 → Step3) and modal back-navigation (Confirm's Back reopens Edit) valid; only edges
   that leave the host open count toward the stack.

   Policy on wiring a stacking `showModal`: resulting stack depth 2 → WARNING (confirm-over-
   edit is legitimate); depth ≥ 3 → reject printing the chain; a cycle over STACKING edges →
   reject printing the cycle. Chains/names truncated in messages. [COUNCIL: security]

   **Parser contract [COUNCIL: security, binding]:** the NEW edge being wired is derived
   STRUCTURALLY from the already-parsed action (eventReferences), never by text-parsing the
   just-compiled binding — so an agent can never emit a showModal the graph misses; pinned by
   an emitter↔parser coupling test (for every schema-valid action containing showModal, parser
   extraction over the compiled binding equals the structural set). Pre-existing DSL is scanned
   with linear global regexes only (`/showModal\('([A-Za-z0-9_]{1,64})'\)/g` and the closeModal
   analogue — no nested quantifiers, no anchored full-match), over TRIGGER PROPS ONLY (the
   EVENTS_BY_TYPE/dynamicTriggerPathList surface, not every string leaf), each prop capped
   (~50 KB, skipped-with-note above), per-prop try/catch, regex-scan only — never eval or AST-
   parse user JS. Unparseable/oversized human-authored bindings are NOT counted (fail-open —
   this is a UX-quality control, not a security boundary) and inspect_page reports the COUNT
   of bindings excluded from modal analysis so the omission is visible per-page.
   [COUNCIL: product] Nested trigger props (e.g. table primaryColumns button events —
   human-authorable only) are outside the scan; documented limitation.

   The same graph runs in the page lint so inspect_page reports existing stacks/cycles as
   warnings.

## F. Actionable repair payloads

Overlap and clipped diagnostics (lint + the delta-gate rejection) gain
`suggestedFix: { tool: "patch_widgets", operations: [...] }` — move ops for overlaps, resize
ops (B2) for clipped/overflowing parents — literal operations the agent can apply verbatim
instead of doing spatial reasoning on a grid.

- Multi-widget fixes are computed SEQUENTIALLY against simulated occupancy (each fix applied
  to the in-memory state before computing the next), so applying the whole payload is
  conflict-free; pinned by a multi-overlap round-trip test (applying the payload clears every
  diagnostic). [COUNCIL: product+architect]
- Every emitted suggestion must itself validate against widgetPatchSchema (explicit test
  assertion, not just "clears the diagnostic"). [COUNCIL: security] Payloads are operations-
  only; the agent supplies the fresh revision.
- This also serves the "fix existing messes" need: inspect_page on a human-messed page returns
  ready-to-apply repair payloads, not just prose warnings.

## Telemetry [COUNCIL: product]

Existing patterns only: repair adjustments and cascade pushes appear in changes/notes;
overlap_introduced rejections, modal warns/rejects, and strict rejections are countable from
the M4-T4 request events (statusClass + tool) plus the changes payload on governed audits.
Success measure: MCP-introduced overlap warnings trend to zero; repair rate declines as agents
learn placement.

## G. Docs / capabilities / instructions / tests

- patchSpec: document `strict`, the repair behavior + reparent semantic change, the new
  `resize` op, container fit/cascade, and modal-move rules.
- Placement guide: overlap gate + repair semantics; swap-needs-a-temp-move note; modal rules
  section (both mechanisms, close-aware transitions, depth-2-warn/3-reject, the human-edit
  fail-open caveats incl. nested trigger props).
- Tests: occupancy unit tests (collisions, pushdown determinism, per-canvas column clamp,
  NaN/absurd-rect hygiene, detached-widget exclusion); move repair/strict/reparent (+ note
  surfacing); resize (grow cascade, shrink-below-children reject with executable minimum,
  modal px translation, width clamp); delta gate (introduced vs pre-existing, name-pair-key
  reparent-together case, multi-op initial-vs-final); container/form/tabs auto-grow cascade
  incl. the add-inside-container regression case; modal structural rejection (build, edit,
  move — incl. nested-in-container); showModal depth 1/2/3, close-aware wizard chain valid,
  back-nav cycle valid, stacking cycle rejected, unparseable fail-open + excluded-count,
  emitter↔parser coupling test; suggestedFix multi-overlap sequential round-trip + schema
  validity of every emitted suggestion; capabilities/instructions drift tests.

## Sequencing

Two reviewable stages [COUNCIL: architect]:
1. occupancy.ts + behavior-identical intersect extraction; then delta gate in commitLayout +
   collision-aware move/reparent + resize op + container-fit cascade (kills the screenshot
   class; independently shippable).
2. Modal rules (structural + close-aware event graph) + repair payloads + docs.

## Alternatives considered

- Porting the client's reflow engine (src/reflow) into the Node builder: rejected — heavy,
  drags client deps into the MCP; deterministic pushdown covers the authoring need.
- Absolute overlap gate (reject if ANY overlap exists after mutation): rejected — blocks all
  edits to pre-existing messy pages; delta gate chosen.
- Hard reject on move collisions by default: rejected — repair-with-note converges agent
  sessions faster; strict mode preserved for callers that want reject semantics.
- Blocking modal depth 2: rejected — confirm-dialog-over-edit-modal is legitimate UX; warn
  at 2, reject at 3+.
