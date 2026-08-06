# MCP Capability Release — Design

**Date:** 2026-07-11
**Branch:** `feat/15383/add_mcp_server`
**Goal:** The most capable, fully-usable Appsmith MCP release. Not an MVP — a system an
external AI (Claude / GPT) can use to build *functional* Appsmith apps end-to-end, with a
verify→fix loop, native instruction delivery, a broad widget catalog, and a real data layer.

## Organizing principle

> Every write is verifiable (lint), every capability is teachable (instructions),
> before we add power (catalog) or surface (data).

Two levers (feedback loop + instruction sets) are *force multipliers* that make the other
two (catalog + data) safe and usable. They ship first.

## Current surface (baseline)

- **Read:** `list_workspaces`, `list_applications`, `get_application_context`
- **Guidance (static):** `get_capabilities`, `list_presets`, `get_preset`
- **Authoring:** `validate_app_spec` → `build_application` / `edit_page` (auto-places 7 widget
  types: text, input, select, button, image, table, container)
- Compiler: `builder/{schema,templates,layout,compile,presets,capabilities}.ts`
- Security posture already established: raw artifact-import tools removed; SHA-256 pre-hashed
  bearer tokens w/ 90-day TTL; MCP auth filter isolated from form-login.

---

## M1 — Feedback loop / static lint  *(decisions locked by user)*

**What:** a server-side structural linter that reuses the compiler's grid/geometry/name
knowledge. No browser, deterministic, zero new infra, no new attack surface.

- New module `builder/lint.ts`: `lintDsl(root): Diagnostics`.
- Checks: tree integrity (parentId consistency, orphans, cycles, root present); geometry
  (off-grid `rightColumn > 64`, sibling overlap, `bottomRow < topRow`, **container height <
  inner-canvas extent** — guards the bug we just fixed); naming (duplicate `widgetName`,
  invalid chars); required-prop soft warnings (select w/o options, table w/o data);
  **dormant dangling-`{{ }}`-binding check**, activated in M4.
- `Diagnostics = { errors: number, warnings: number, issues: Issue[] }`,
  `Issue = { sev: 'error'|'warn', widget?: string, msg: string }`.
- Integration (user-chosen: **inline + live read-back**): `build_application` and `edit_page`
  read the saved page back and return `diagnostics` inline. New standalone tool
  `inspect_page(applicationId, pageId, layoutId)`.

**Loop:** build → (auto) diagnostics → edit_page/inspect_page → diagnostics → …

## M2 — Instruction sets via MCP prompts + resources

**What:** use MCP's native `resources` and `prompts` primitives to deliver recipes and
guided scaffolds *through the protocol* (not just tool output).

- **Resources** (read-only docs the agent can pull): `appsmith://recipes/{crud,form,dashboard}`,
  `appsmith://cookbook/bindings`, `appsmith://cookbook/placement`, `appsmith://catalog/widgets`.
- **Prompts** (arg-driven guided flows): `scaffold_crud(entity, fields)`,
  `wire_form_to_query(form, query)`, `build_dashboard(metrics)`. A prompt returns a
  structured message sequence that walks the agent through capabilities → preset → validate →
  build → inspect.
- No write surface; pure guidance. Lowest risk.

## M3 — Richer catalog

**What:** broaden what *can* be built. Additive to the compiler; automatically lint-covered.

- **Widgets:** tabs, modal, list, chart, form, (stretch: filepicker, datepicker). Each = a
  `templates.ts` entry (appsmithType, version, footprint, default props) + a `schema.ts`
  discriminated-union arm + compiler handling (containers-with-inner-canvas for tabs/list/form).
- **Theming:** an app-level `theme { primaryColor, borderRadius, fontFamily }` compiled into
  the artifact's theme block.
- **Events:** event-handler *stubs* on button/form (`onClick`, `onSubmit`) — full wiring lands
  in M4 when queries exist.

## M4 — Data layer (queries + bindings)  *(highest value + highest security surface)*

**What:** connect data and make apps *do* things. Re-opens the injection surface deliberately
closed earlier → **security-gated, likely its own sub-flag.**

- **Read:** `list_datasources(workspaceId)`, `get_datasource_structure(datasourceId)`.
- **Write:** `create_query(datasourceId, spec)` (validated query spec, not raw), `bind_widget`
  / spec-level bindings (`table.source = {query}`, `button.onClick = {run: query}`).
- Schema/compiler: a **safe binding DSL** — the agent supplies `{query: 'getUsers'}`, the
  compiler emits `{{ getUsers.data }}` and registers `dynamicBindingPathList`. Agents never
  author raw `{{ }}`/JS.
- M1's dangling-binding lint switches on: every binding must reference a declared query/widget.

### Open decisions → COUNCIL RULES (user directive)

1. **M4 binding safety model** — how much raw expression power to expose (none / whitelisted
   templates / constrained grammar). Security-reviewer + architect authority.
2. **M4 query surface** — wrap existing Appsmith REST (`/api/v1/actions`, `/api/v1/datasources`)
   vs a new constrained MCP-only endpoint. Architect + server-eng.
3. **M4 feature-flagging** — separate `APPSMITH_MCP_DATA_ENABLED` sub-flag vs the existing
   `APPSMITH_MCP_ENABLED`. Product + security.
4. **M3 event model** — stub-only vs full handler grammar in this release. Architect + UX.
5. **M2 prompt/resource scheme** — URI namespace + which recipes ship. DX + product.

## Validation strategy

- TS MCP package (M1–M4 client side): `yarn tsc --noEmit`, `yarn jest`, `eslint` — all run
  locally under node 24. High confidence.
- Server-side (any Java touched by M4): `mvn spotless:apply`; unit tests validated in CI (Java
  can't build standalone locally).
- Each milestone: council review before proceeding.

## Risks (see risks.md)

- M4 re-opens content-injection surface → gated, constrained DSL, security review.
- Headless-render explicitly deferred (chose static lint) → no browser infra risk.
- Scope is large → milestone gates; ship M1–M3 even if M4 is flagged off.
