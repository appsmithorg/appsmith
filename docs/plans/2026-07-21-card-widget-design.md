# Card Widget — Design & Decisions

**Date:** 2026-07-21
**Branch:** `feat/17967/cardWidget`
**Status:** Design approved (brainstorm validated section-by-section with Stacey)

> Note: GitHub issue #17967 is actually an ADS design-system component task ("Create a component for Card", labeled ADS Components). This design is for an **end-user UI widget**; the issue number is used only as a branch label.

## Summary

A Card widget is a reusable container that groups related information and actions into a visually distinct unit — for dashboards, CRMs, catalogs, admin panels. It displays a single logical entity (customer, order, product, task…), is repeatable inside lists/grids, and supports responsive layouts.

**Chosen shape: hybrid.** The widget renders a structured **Media → Header → Footer** chrome from bindable properties, and provides a **Body** that is a real child canvas where users drop any Appsmith widgets.

## Design decisions

| Decision | Choice | Alternatives considered | Reasoning |
|---|---|---|---|
| Architecture | **Hybrid** (prop-driven chrome + canvas body) | (a) Blueprint container (Statbox-style: everything is child widgets); (b) Fully-rendered widget (Table-style: everything from props) | Turnkey binding for the 80% case (title/subtitle/badge straight from a query row) + full composability via the body canvas. A pure container can't guarantee consistent hover/selected/loading states; a fully-rendered widget can't embed arbitrary widgets. |
| Layout system | **Legacy widget system** (`app/client/src/widgets/`) | Anvil/WDS; both/phased | Works in fixed and auto-layout apps CE users actually run; Anvil is out of the CE plan. |
| Base class | **`BaseWidget`** (not `ContainerWidget`) | Subclass ContainerWidget like Statbox | The widget owns rendered chrome around the canvas; Container subclassing gives styling-only reuse and fights the zone rendering. Body canvas is a `CANVAS_WIDGET` child like Container's. |
| Feature flag | **None** | Flag-gated rollout | Additive widget, inert by default (per standing preference: no flags for additive changes). |
| V1 scope | Core card + styling, list integration, selection + states, expand/collapse + overflow menu | Minimal core-only v1 | All four clusters approved for v1, delivered in phases A/B/C (each independently shippable). |

## Architecture

```text
┌──────────────────────────────┐
│ media (cover img, optional)  │  ← rendered from props (Top/Left/None)
├──────────────────────────────┤
│ 👤 {{title}}   [badge]    ⋮ │  ← rendered from props
│    {{subtitle}}              │
├──────────────────────────────┤
│                              │
│   (drop any widgets here)    │  ← child CANVAS_WIDGET
│                              │
├──────────────────────────────┤
│ [Edit] [Delete] [View]       │  ← actions array from props
└──────────────────────────────┘
```

- `CardWidget` (`CARD_WIDGET`) in `app/client/src/widgets/CardWidget/`, registered in the legacy registry, tag "Display", fixed + auto-layout support.
- Wrapper element is a semantic `<article>`; clickable mode adds `role="button"` + keyboard Enter/Space.
- Body canvas seeded via blueprint (a default Text widget) on first drop, Statbox-style.
- Overflow (⋮) menu and footer actions reuse the MenuButton/ButtonGroup `PanelConfig` patterns.
- Media slot handles loading fallback + broken-image placeholder like the Image widget.

## Property pane — Content

### Data

| Property | Type | Notes |
|---|---|---|
| `cardData` | object (bindable) | Convenience binding target, e.g. `{{userQuery.data[0]}}` or `{{currentItem}}`. Individual props default to reading from it (seeded by one-click binding) but are independently overridable. |

### Media

| Property | Type | Notes |
|---|---|---|
| `mediaImage` | URL (bindable) | e.g. `{{currentItem.thumbnail}}` |
| `mediaPosition` | Top / Left / None | Top = cover (e-commerce), Left = thumbnail (horizontal card) |
| `mediaHeight`, object-fit | number, cover/contain | |

### Header

| Property | Type | Notes |
|---|---|---|
| `title`, `subtitle` | text (bindable) | |
| avatar image URL / icon | bindable | Image takes precedence over icon |
| `badgeText`, `badgeColor` | bindable | Data-driven status colors |
| `showHeader` | boolean | |

### Footer actions
Repeatable panel items (ButtonGroup pattern): label, icon, variant, color, `onClick`, `visible`, `disabled`. Plus `showFooter`.

### Overflow menu
Menu items panel, same shape as MenuButton static items.

### General
`visible`, `animateLoading`, expand/collapse enabled + `defaultExpanded`, `selectionEnabled`, clickable.

### Events
`onClick` (whole card, clickable mode only), `onSelect`, `onExpand`, `onCollapse`. Footer/menu items carry their own `onClick`.

## Property pane — Style

Background color, border color/width/radius, elevation (shadow), header/footer dividers, padding density, hover effect toggle, selected-state accent color. Themeable via `getStylesheetConfig`.

## Exposed properties, meta, setters

- **Autocomplete/bindings:** `Card1.cardData`, `Card1.isSelected`, `Card1.isExpanded`, `Card1.isVisible`.
- **Meta properties:** `isSelected`, `isExpanded` (runtime, reset on page load) with `defaultSelected`/`defaultExpanded` — Switch `isSwitchedOn` pattern.
- **Setters (`getSetterConfig`):** `setVisibility`, `setSelected`, `setExpanded`.

## Interaction model & states

- **Selection:** `selectionEnabled` toggle; card click (or hover checkbox — style-pane choice) toggles `isSelected`, fires `onSelect`. Multi-select = multiple cards' `isSelected` read by other widgets; true bulk-select UX arrives with List integration (v1.1). 
- **Expand/collapse:** collapses body+footer to media+header (compact mode); chevron in header; fires `onExpand`/`onCollapse`. Uses `DynamicHeight` plumbing (like Statbox) in fixed layout.
- **States:** hover (elevation lift, optional), selected (accent border), loading (skeleton over media/header/footer + `animateLoading` on children), disabled (dimmed, non-interactive), clickable.
- **Accessibility:** `<article>` semantics, aria-labels from title, focus ring, focus management into overflow menu, keyboard activation.

## Image support

1. **Media slot** (first-class, prop-driven) — cover/thumbnail/logo cases with zero layout work; participates in skeleton state.
2. **Body canvas** — drop the Image widget (or Video/Iframe) for arbitrary placements.
3. **Header avatar** — small circular photo case.

## Risks

| Risk | Severity | Notes |
|---|---|---|
| Canvas-bearing widget inside ListWidgetV2 (meta-widget generation) | **High — top risk of v1** | Container works there today, but rendered chrome + child canvas combo needs explicit verification in the List path. Phase C exists to de-risk this. |
| Dynamic height + expand/collapse interaction in fixed layout | Medium | Reuse Statbox `DynamicHeight`; verify collapse reflow. |
| Property pane sprawl | Low | Mitigate with sections + sensible defaults; media/header/footer toggles hide unused zones. |

## Rollout phases (all v1, each independently shippable, no flag)

- **Phase A — Zones + styling + events:** widget scaffold, media/header/body-canvas/footer rendering, style pane, theming, onClick/action events, blueprint defaults.
- **Phase B — States:** selection (`isSelected` meta + onSelect), expand/collapse (+DynamicHeight), loading skeleton, disabled, hover/selected styling, setters.
- **Phase C — List integration:** `currentItem` binding verification inside ListWidgetV2, one-click binding (`cardData` seeding), meta-widget path fixes, docs/examples.

## Implementation prompts

### Phase A prompt
> In `app/client/src/widgets/`, create a new `CardWidget` (`CARD_WIDGET`) following the repo's widget conventions (see StatboxWidget for blueprint/canvas patterns, ButtonGroupWidget for the actions PanelConfig, MenuButtonWidget for the overflow menu config). It extends `BaseWidget` and renders four zones: a prop-driven media slot (`mediaImage`, `mediaPosition` Top/Left/None, object-fit), a prop-driven header (avatar/icon, `title`, `subtitle`, `badgeText`/`badgeColor`, overflow menu), a body that is a child `CANVAS_WIDGET` (like ContainerWidget) seeded via blueprint with one Text widget, and a prop-driven footer rendered from a repeatable actions array (label, icon, variant, color, onClick, visible, disabled). Add Content and Style property-pane configs per the design doc (docs/plans/2026-07-21-card-widget-design.md), including `cardData` object binding, zone show/hide toggles, and `getStylesheetConfig` theming. Register the widget (tag Display), add icon/thumbnail SVGs, support fixed and auto-layout. Wrapper is `<article>`; clickable mode adds button semantics + keyboard activation and an `onClick` event. Run impact analysis before editing shared files; run check-types, ESLint on changed files, and unit tests before finishing.

### Phase B prompt
> Extend `CardWidget` with runtime states per the design doc: `isSelected` and `isExpanded` meta properties (with `defaultSelected`/`defaultExpanded`, Switch-widget pattern) exposed for binding; `onSelect`, `onExpand`, `onCollapse` events; `selectionEnabled` behavior (card click or hover checkbox toggles selection, accent-border selected style); expand/collapse that hides body+footer leaving media+header, with a header chevron, integrated with the `DynamicHeight` feature in fixed layout (see StatboxWidget); loading skeleton over media/header/footer tied to `animateLoading`; disabled state; hover elevation. Add `setVisibility`, `setSelected`, `setExpanded` via `getSetterConfig`. Add/extend unit tests for meta props, setters, and derived state.

### Phase C prompt
> Verify and fix `CardWidget` inside `ListWidgetV2`: place a Card in a List row, confirm meta-widget generation handles the rendered chrome + child canvas, `{{currentItem}}` bindings resolve per-row, selection/expand meta state is row-scoped, and events fire with correct row context. Add one-click binding support so binding a datasource seeds `cardData` and default title/subtitle/media bindings. Add Cypress coverage: card in canvas (zones render, actions fire), card states, card inside List with `currentItem`. Document known limitations found.

## Deferred to v2+

Drag-and-drop/Kanban support, circular progress/metrics as first-class props (use body widgets instead), card templates/presets gallery, horizontal orientation beyond media-left, per-zone conditional expressions (children already support `visible` bindings).
