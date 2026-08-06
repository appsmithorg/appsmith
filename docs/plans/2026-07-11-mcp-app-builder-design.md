# MCP App-Builder — Design (v1)

Date: 2026-07-11
Status: Approved (80% solution — pragmatic, best-effort; not exhaustive)
Feature branch: `feat/15383/add_mcp_server`

## Goal

Let an MCP caller (Claude / ChatGPT — already an AI agent) build and edit Appsmith
applications by describing intent at a high level. Appsmith "knows how to place
things": the MCP layer auto-lays-out widgets and compiles to Appsmith's real import
artifact, which the existing ACL-enforced import APIs persist.

## Decisions (locked)

1. **High-level page spec**, not raw DSL. The agent describes widgets; the MCP layer
   auto-places and compiles.
2. **Compiler lives in the Node MCP package** (`app/client/packages/mcp`), using a
   curated per-widget template library. No server changes. Drift guarded by a fixture
   test.
3. **The caller's agent drives a toolkit.** The MCP exposes presets, capability/schema
   discovery, a validating compiler, and build/edit tools. The MCP does not re-run the
   caller's reasoning. Appsmith AI-assist is an optional, flag-gated booster (deferred).

## Target format (verified against the codebase)

Import endpoint `POST /api/v1/applications/import/{workspaceId}` (multipart, Gson-parsed
into `ApplicationJson`). Minimal valid artifact:

- `exportedApplication` — at least `{ name }`
- `pageList` — ≥1 `NewPage`, each with `unpublishedPage.layouts[0].dsl` = a root
  `CANVAS_WIDGET` (`widgetId:"0"`, `widgetName:"MainContainer"`, `snapColumns:64`,
  `parentColumnSpace:1`, `parentRowSpace:1`, `children:[]`)
- `actionList: []` and `datasourceList: []` (must be present, may be empty)
- `clientSchemaVersion: 2`, `serverSchemaVersion: 12`

Widget DSL: start from the client's `getDefaults()` blob per type, then stamp
`widgetId`, unique `widgetName`, `type`, `version`, `parentId`, `renderMode:"CANVAS"`,
`isVisible:true`, `isLoading:false`, grid bounds `topRow/bottomRow/leftColumn/rightColumn`
(+ `mobile*` mirrors), `parentColumnSpace/parentRowSpace`. Drop `rows`/`columns`.
Grid: 64 columns, row height 10px. Containers nest an inner `CANVAS_WIDGET`.

## Agent-facing page spec (Zod-validated)

Build:
```json
{ "name": "Customers",
  "widgets": [ { "type": "table", "data": "{{getCustomers.data}}" },
               { "type": "input", "label": "Email" } ] }
```
Edit (append to an existing page):
```json
{ "add": [ { "type": "input", "label": "Phone", "placement": { "after": "Email" } },
           { "type": "text",  "text": "Details", "placement": { "inside": "DetailsCard" } } ] }
```

Placement (best-effort, always reports what it did): omitted → append below the page
canvas's max `bottomRow`; `after:"<name>"` → below that widget; `inside:"<name>"` →
into that container's inner canvas. Miss → append + note.

## Tool surface (added to `buildMcpServer`)

| Tool | Purpose |
|---|---|
| `get_capabilities` | Catalog of supported widget types, spec fields, and presets. |
| `list_presets` / `get_preset` | Ready page-specs the agent adapts (form, table-detail, card-grid, crud). |
| `validate_app_spec` | Dry-run: compile + return structured errors, import nothing. |
| `build_application` | Compile pages → artifact → existing import API. |
| `edit_page` | Read current DSL → compile add-spec → append (best-effort placement) → write back. |

Existing `list_workspaces`/`list_applications`/`get_application_context` remain. All
tools stay token-scoped; the import/layout APIs do all authorization.

`edit_page` write path: prefer the layout-update API (read → merge-append → `PUT
/layouts`) for placement control — the DSL is compiler-produced (not agent-raw) and we
only append, which is materially safer than the removed `update_layout`. Verify
partial-import merge/placement first; use it instead if it places acceptably. Flag for
the review council.

## Package layout

```
src/builder/
  schema.ts       Zod schema: page spec + app spec + edit spec + placement
  templates.ts    curated getDefaults per widget (text,input,select,button,image,table,container)
  layout.ts       vertical auto-placement on the 64-col grid; placement resolution
  compile.ts      pageSpec[] -> import artifact; edit merge into existing DSL; depth/total-widget caps
  presets.ts      form, table-detail, card-grid, crud
  capabilities.ts machine-readable widget/preset catalog
```

(As-built naming: `schema.ts` — `spec.ts` collides with jest's test glob; `validate_app_spec` — it validates a whole app spec.)

## v1 widget set

`text, input, select, button, image, table, container`. Covers the
"directory + grid + card + upload" example minus datasource wiring.

## Testing

- Unit: each widget template emits required structural fields; layout stacking;
  placement resolution (append / after / inside / miss-fallback).
- Fixture drift test: compile a sample app; assert the artifact satisfies the import
  contract (top-level fields, schema versions, root canvas shape). Catches DSL/schema
  drift against the real import format.
- Honest limit: true render verification needs a running Appsmith instance and is out
  of scope for unit tests; the fixture test approximates it against the documented
  format.

## Deferred (designed, not v1)

- `suggest_spec` AI-assist booster: Appsmith ask-AI + our keys, gated by the ask-AI
  feature flag. For heavier server-side generation when enabled.
- Datasource schema introspection: Supabase/Postgres table → infer columns → generate
  query + bind a table (the "connects to my Supabase table" step).
- Modify/remove existing widgets by name (property patching); precise/pixel layout.

## Risks

- Widget-default drift vs client configs → keep the v1 set small; schema-version pins
  tested against literals (2/12) so a compiler drift trips CI. (The real cross-check
  against `JsonSchemaVersionsFallback.java` is a deferred hardening.)
- `edit_page` layout-write reintroduces a layout-mutation path → mitigated by
  compiler-produced DSL + append-only + ACL'd endpoint + the same size/plain-JSON guard
  the import path uses; reviewed by the council (APPROVE WITH RISKS).
- `edit_page` read-merge-write has **no optimistic concurrency** — a lost-update window
  against a concurrent editor. Accepted for v1; append-only bounds the damage.
- DoS/amplification: per-array Zod caps are per-level only → compiler enforces an
  aggregate `MAX_TOTAL_WIDGETS` (300) and `MAX_CONTAINER_DEPTH` (5), surfaced as clean
  validation errors.
- The deferred **modify/remove existing widgets** feature would reintroduce full-DSL
  mutation risk (property-patching foreign widgets) — it is NOT a small increment and
  must be re-reviewed on its own.
- No true render verification locally (needs a running instance) → accepted for the 80%
  bar; the contract/compile tests approximate it.

## Council review (2026-07-11)

security-reviewer, senior-architect, qa-engineer → **APPROVE WITH RISKS**. The
re-introduced layout-write path was cleared as safe (compiler-produced, append-only,
ACL-enforced). Hardening applied from the review: aggregate depth/widget caps, the
`edit_page` write-path size/plain-JSON guard, literal schema-version pins, and an
`edit_page` end-to-end test. Tracked (non-blocking): lost-update window, and the
modify/remove-widgets re-review requirement above.
