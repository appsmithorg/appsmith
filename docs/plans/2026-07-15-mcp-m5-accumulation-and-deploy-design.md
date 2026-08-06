# MCP M5 — Store accumulation vocabulary, agent-UX bug fixes, auto-publish

Date: 2026-07-15
Status: APPROVED WITH CONDITIONS — design council 2026-07-15 (senior-architect, security-reviewer,
product-planner: all APPROVE WITH RISKS). All conditions are folded into the sections below and
marked [COUNCIL]. Security re-review of T2/T3 code is mandatory before commit.
Origin: field report from a ChatGPT session building a "ZIP code lookup with accumulating
results table" app via the MCP. Root-cause investigation (3 parallel explorations, findings
verified against `app/client/packages/mcp/` source) mapped each reported failure to:

| Reported failure | Root cause | Fix |
|---|---|---|
| "Can't patch table bindings; schema doesn't match" | REAL BUG: docs say `source: {query}` on patch_widgets; patch path requires `tableData` (`source` there = selected-row `{table,column}`). CRUD recipe (instructions.ts:133-135) instructs the exact failing call. Machine inputSchema is `z.record(z.unknown())` — opaque. | M5-T1 |
| "User can't access or edit the created app" | Unpublished apps ARE editable; build_application returns no editor/viewer URL or usable ids. Publish tools unregistered without governance. | M5-T1 (URLs) + M5-T3 (deploy) |
| "Can't append results across lookups / bind table to state" | BY DESIGN: no storeValue verb in event vocabulary, JS objects stateless, table bindings query-only. User wants the ability (closed-vocabulary extension chosen over free-form JS). | M5-T2 |

User decisions (2026-07-15): accumulation via **closed-vocabulary extension** (NOT free-form
JS); **auto-publish new apps** on build_application.

## Invariant preserved

Agents never author raw JS, DSL, SQL, or `{{ }}` bindings. Every new capability below is a
named-reference vocabulary the server compiles; all identifiers pass the existing
`bindingIdentifier` charset validation before being interpolated into emitted code.

## M5-T1 — Bug fixes (no design fork)

1. **Docs reconciliation** (`src/builder/instructions.ts`, `src/builder/capabilities.ts`):
   - CRUD recipe: for patch_widgets, `tableData: { query }` (NOT `source`); keep `source` for
     the build-spec path and say so explicitly.
   - Bindings guide: document both paths side by side; name `tableData` for patch.
   - capabilities: add a `patchSpec` section (the single source of truth agents are steered
     to) enumerating patchable props incl. `tableData`, with the build-vs-patch naming warning.
2. **Schema exposure** (`src/app.ts`): replace `z.record(z.unknown())` with the real zod
   schemas for `patch_widgets` (widgetPatchSchema) and `wire_event` (wireEventSpecSchema) —
   both are compact. `build_application`/`edit_page` specs are huge; keep those opaque but
   fully documented via the new capabilities sections (avoids multi-KB tool schemas in every
   client context).
3. **URLs in build_application** (`src/app.ts` build handler): return
   `{ applicationId, pages: [{ id, slug }], editorUrl, viewerUrl }` alongside the existing
   result. Origin resolution: `X-Forwarded-Proto` + `Host` from the request (Caddy preserves
   both); fall back to a root-relative path when absent. URL shape:
   `/app/{applicationSlug}/{pageSlug}-{pageId}/edit` and the same without `/edit` for viewer.

## M5-T2 — Store accumulation (closed vocabulary)

Store keys use a dedicated schema [COUNCIL: architect + security]:
`storeKey = ^[A-Za-z_][A-Za-z0-9_]*$` (no leading digit — the emitted dot-access read would be
a syntax error), max 64, `.refine()` denylist of every `Object.prototype` own property name
(`__proto__`, `constructor`, `prototype`, `hasOwnProperty`, ...) — `storeValue('__proto__',...)`
would rewrite the store object's prototype (StoreActionSaga does bare `currentStore[key] =`).

New event-statement verbs (`src/builder/events.ts`), valid as primary or onSuccess/onError
follow-up, same non-nesting rule as existing verbs:

- `appendToStore: { key, query, field?, fields? }` → emits
  `storeValue('<key>', [].concat(appsmith.store.<key> ?? [], <expr> ?? []), false)`
  - `[].concat` [COUNCIL: architect] flattens an array-returning query (one row per record)
    and appends an object response as a single row — the naive spread would accumulate
    arrays-of-arrays.
  - `persist=false` (third arg) [COUNCIL: security] — the Appsmith store persists to
    localStorage keyed per APP not per user, so persisted accumulation would leak rows fetched
    under one user's ACL to the next user of a shared browser, and outlive logout. Session-only
    is a deliberate, documented choice (results reset on reload). Also removes the localStorage
    quota self-DoS path.
  - `<expr>` without projection: `<query>.data` (or `<query>.data?.<field>` — `field` keeps
    the existing responseFieldPath rules).
  - `fields` projection [COUNCIL: product] — the originating ZIP API has space-keyed and
    array-indexed values (`"post code"`, `places[0].state`), unreachable by identifier paths.
    `fields: [{ as: storeKey, path: (string|number)[] }]` (≤20 fields, path ≤5 elements)
    compiles each path element through `JSON.stringify` into bracket access:
    `{ state: <query>.data?.["places"]?.[0]?.["state"] }` appended as ONE row per invocation.
    JSON.stringify escaping makes arbitrary-string path elements injection-safe. `field` and
    `fields` are mutually exclusive.
  - `query` must resolve to an existing action (existing eventReferences dangling guard).
- `clearStoreKey: { key }` → emits `storeValue('<key>', [], false)`.
  - Named clearStoreKey, NOT clearStore [COUNCIL: security] — the platform global
    `clearStore()` wipes the entire store; this verb empties one key.
- Primary action may be a single statement OR an array of 2–5 statements executed in order
  [COUNCIL: product] — required so a Clear button can `clearStoreKey` + `reset` the input in
  one click (only `run` carries onSuccess/onError; at most one `run` per list; emission joins
  the same fixed templates with `;`, so the security profile is unchanged).

New table binding form (`src/builder/schema.ts`):

- `{ store: "<storeKey>" }` → emits `{{ appsmith.store.<key> ?? [] }}`
  - Table (build/edit/patch `tableData`) accepts a union of the query form and the store form.
  - The LIST/card widget keeps the query-only schema [COUNCIL: architect — tableDataRefSchema
    has a 4th consumer, the list widget; store-bound card grids are explicitly out of scope
    in v1 and must not silently change contract].
  - Store-bound cells render the same named-query data already reachable via `{{ Q.data }}`;
    TableWidgetV2 escapes plain-text cells — no new XSS sink [COUNCIL: security, verified].

Lint (`src/builder/lint.ts`): a store-bound table whose key has no appendToStore/clearStoreKey
writer on the page → WARNING (not error — the store is app-global; a writer may live on
another page). `storeValue`/`appsmith` are already recognized global heads.

Telemetry [COUNCIL: product]: wire_event commits include the statement verb kinds in the
existing changes/audit payload so appendToStore/clearStoreKey adoption is measurable; auto-
publish success vs "created but not deployed" warning rate measurable from the M4-T4 events.

Docs/capabilities/tests: catalog entries, bindings guide worked example = the exact ZIP-lookup
recipe (now fully expressible incl. `"post code"`/`places[0]` via fields projection),
compiler tests + wire_event/table-binding integration tests, get_capabilities drift test.

Security analysis (validated by council): emitted code interpolates only charset-validated
identifiers or JSON.stringify-escaped literals into fixed templates — no agent-controlled
expression reaches the eval worker. The store is per-browser-profile (NOT per-user), hence
persist=false above. appendToStore writes only what a named query returned under the caller's
own ACL. Residual accepted: unbounded in-session store growth (self-DoS of the viewer's own
tab; LOW).

## M5-T3 — Auto-publish new apps

`build_application` handler, after successful import: call
`api.publishApplication(applicationId)` (existing API wrapper, currently used only by
confirm_publish).

- Publish failure → `warnings: ["created but not deployed: <class>"]` in the result; the
  create itself still succeeds. Never fail the create on a publish error.
- Applies ONLY to the app just created by this call — a brand-new app has no existing deployed
  state to clobber, so this does not weaken the governed prepare/confirm posture, which remains
  required (and git-refusing) for RE-publishing existing apps. A same-session re-publish
  exemption was considered and REJECTED: post-creation edits are indistinguishable from edits
  to any existing app, so they keep the governed flow.
- Audit [COUNCIL: security + architect]: when governance is present, the auto-publish is
  recorded through `gov.execute` (a change record, like confirm_publish); on ungoverned
  deployments it emits a `logMcpEvent("appsmith_mcp_auto_publish", ...)` line (M4-T4 pattern)
  so the deploy is never silent. Deliberate posture change, recorded in decisions.md: deploy
  of a JUST-CREATED app becomes reachable on ungoverned instances (previously publish was
  entirely unregistered there).
- Publishing does NOT make the app public (isPublic is a separate ACL switch); it only
  materializes the viewer copy for users who already have access. README notes this so admins
  are not surprised that new (possibly half-built) apps are visible to workspace members.
- Capabilities copy reconciled [COUNCIL: architect]: the governance gate copy and
  build_application description must say publish-on-create is automatic and governance gates
  RE-publish only.
- Publish-last guidance [COUNCIL: product]: auto-publish fires before queries/wiring exist, so
  the viewer copy is a scaffold until re-published. SERVER_INSTRUCTIONS/recipes updated: finish
  wiring, then prepare_publish/confirm_publish (governed) and hand the viewer link LAST; on
  ungoverned deployments relay the editorUrl plus the governance `requires` message instead of
  promising a live viewer link.

## URL construction [COUNCIL: security + architect conditions]

- Preferred source: new env `APPSMITH_MCP_PUBLIC_ORIGIN` (validated absolute http(s) origin,
  fail-closed to unset on invalid value, parsed in gates.ts like the session limits).
- Fallback: derived from the INITIALIZE request's headers, captured once per session and
  threaded through the server-construction seam (buildMcpServer context — handlers never see
  raw requests): `X-Forwarded-Proto` validated against the literal enum {http, https}; Host
  parsed via hostHeaderName + charset `^[a-z0-9.-]+(:[0-9]+)?$`; when APPSMITH_MCP_ALLOWED_HOSTS
  is configured the host must be in it. ANY validation failure → root-relative URLs
  (`/app/<appSlug>/<pageSlug>-<pageId>/edit`), never a guessed absolute origin. Rationale: a
  forged Host/proto on direct port access would put a phishing-grade absolute URL in a trusted
  agent channel.
- Slug fallback: if the import response lacks application/page slugs, return ids and omit the
  URLs rather than constructing a broken path.

## Sequencing & verification

T1 first (unblocks agents immediately), then T2, then T3 (T3 touches the same handler as T1's
URL work — do URLs first, publish second). Each task: package jest suite + tsc + eslint (both
cwd paths) + prettier; council code review before commit. End-to-end: rebuild the ZIP-lookup
app spec through the tool pipeline in a test (build → wire Lookup with run+appendToStore →
wire Clear with clearStore+reset input → table bound to store key → auto-publish result has
URLs) as the acceptance test.

## Alternatives considered

- Free-form JS objects: rejected (user + security posture) — stored-XSS-equivalent surface.
- `removeValue` on clear: storeValue(key, []) chosen — keeps `?? []` table binding stable.
- Exposing full appSpec zod as MCP inputSchema: rejected for context bloat; documented via
  capabilities instead.
- Auto-publish behind an env flag: rejected as an unnecessary knob; behavior is safe for new
  apps and explicitly requested.
