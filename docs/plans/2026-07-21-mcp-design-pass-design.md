# MCP Builder Design Pass — styled defaults + role-aware layout

**Goal:** every `build_application` / `edit_page` output looks designed without any
spec change: real typographic hierarchy, side-by-side packing where it reads
better, spacing rhythm, and KPI/action treatments. All style values remain
compiler-owned (closed-vocabulary posture unchanged).

## Decisions

1. **New module `builder/design.ts`** — tokens, role inference, row planner.
   Pure functions of the spec: compileApp stays deterministic.
2. **Roles inferred from what agents already send** (no schema change):
   - `pageTitle` — first widget of a page when it is a text with a static
     literal (page root only).
   - `sectionHeader` — static text immediately followed by a table, chart,
     list, form, container, jsonform, or tabs.
   - `kpi` — text bound to a computed `value` (count/formula/now); 2–4 in a
     row become a KPI row.
   - `field` — input-like widgets (input, select, datepicker, multiselect,
     currencyinput, phoneinput); consecutive fields pair two per row.
   - `action` — consecutive buttons; the row right-aligns (form-footer look).
   - `body` — everything else; full-width stacking as today.
3. **Row planner** assigns leftColumn/columns per slot on the 64-col grid with
   a 2-col gutter (fields 31/31, KPIs equal-split, buttons hug right) and a
   spacing rhythm: 1 row inside groups, 3 rows before new sections, 2 after
   the page title.
4. **Typography scale** (role styling on TEXT_WIDGET): pageTitle 1.875rem
   bold, sectionHeader 1.25rem bold, kpi 1.5rem bold (taller slot), body
   1rem normal. The old default (every text 1rem bold) goes away; the list
   card title sets bold explicitly.
5. **No auto-wrapping containers in v1.** Wrapper containers would change what
   `read_semantic_page`/`patch_widgets` see and eat widget budget. Packing +
   typography + spacing deliver most of the lift without them.
6. **`edit_page` appends run the same single-spec role inference** (a KPI
   text styles identically whether built or appended) but get no
   cross-widget packing — each `add` entry places independently (placement
   targets make packing ambiguous) — and never the pageTitle role.
7. Theme overrides (`primaryColor` etc.) still apply after role styling, as
   today. Buttons keep inheriting the app theme's primary.

## Alternatives considered

- Post-compile beautification pass: rejected — regrouping after placement
  fights the occupancy model; doing it during planning is simpler.
- Named theme presets / brand-derived palettes: deferred (customer-expressed
  style was explicitly deprioritized in favor of better defaults).

## Risks

- Existing geometry-asserting tests change deliberately; review each diff.
- Agents that read `read_semantic_page` see new leftColumn values — the
  semantic layer already reports geometry, no shape change.
