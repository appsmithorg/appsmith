# Appsmith MCP — Full Coverage Roadmap

**Goal:** bring the MCP server's closed vocabulary to ~100% of what Appsmith itself supports — every safely-wrappable widget, table/chart capability, and datasource plugin — without breaking the core invariant (agents never author raw DSL/SQL/JS/expressions; the server compiles everything from structured input under the caller's ACL).

**Guiding rule (from user):** a capability is in scope only if Appsmith already supports it; the MCP just hasn't wrapped it. This is coverage/wrapping work, not platform features.

**Explicit exclusions (security, not laziness):**
- `CUSTOM_WIDGET` — arbitrary HTML/JS/CSS authored by the agent. Same class as raw-JS authoring; belongs to the gated raw-code proposal (task C4), not the closed vocabulary.
- `CUSTOM_FUSION_CHART` chart type — arbitrary chart config. Same reason; wrap the fixed chart types only.
- `appsmithAi` datasource — excluded per user.
- Deprecated V1 widgets already superseded by a V2 the MCP supports (INPUT/TABLE/LIST/MULTI_SELECT/DATE_PICKER/FILE_PICKER v1, DROP_DOWN, FORM_BUTTON, TABS_MIGRATOR, BASE_INPUT, EXTERNAL) — no value in wrapping the old generation.

---

## Progress (updated 2026-07-19)

**Part A — Widgets: COMPLETE.** All seven widget milestones shipped and pushed on `feat/15383/add_mcp_server`. 25 new widgets, one per-milestone commit; every commit green on the full mcp jest suite + check-types + eslint + prettier, versions drift-guarded.

| Milestone | Widgets added | Commit | Notes |
|-----------|---------------|--------|-------|
| W1 | divider, progress, circularprogress, rate, iconbutton | `c7dd8b3323` | statbox deferred → W1b (composite canvas) |
| W2 | iframe, video, audio, documentviewer | `bd2340ab46` | **security council: APPROVE** (safeUrl gate — http/https only, no srcDoc, no SSRF) |
| W3 | currencyinput, phoneinput, numberslider, categoryslider, rangeslider, checkboxgroup, switchgroup | `00a994647a` | |
| W4 | menubutton, buttongroup | `947a987980` | per-item click wiring is a wire_event follow-up |
| W5 | singleselecttree, multiselecttree | `272f04545d` | jsonform deferred → W5b (schema auto-derivation, needs live-DP) |
| W6 | camera, audiorecorder, codescanner | `d1a96dc909` | |
| W7 | map, mapchart | `3ca3760880` | map needs a tenant Google Maps key to render |

**Previously-deferred widgets: NOW COMPLETE** (`af2d2d829b`, security council: APPROVE) — richtext (RICH_TEXT_EDITOR, gated to plain-text seed), jsonform (JSON_FORM auto-generated from a data object), statbox (STATBOX KPI card via container composition). Excluded per plan: CUSTOM_WIDGET, CUSTOM_FUSION_CHART.

**Part B — Table & Chart depth: COMPLETE.**

| Milestone | Commit | Notes |
|-----------|--------|-------|
| T1 (table columns: types, computed columns via a per-row `cell` formula leaf) | `a062fd56a7` | **security council: APPROVE** (charset-safe, guarded cell leaf). Live-DP: date/url/media column formats, subset-vs-auto-append. |
| Ch1 (chart depth: multi-series query binding, SCATTER, axis/label config) | `92f277b151` | reuses the M4 chart-binding charset gate — no council needed. Live-DP: multi-series + SCATTER render. |

**Part C — Datasources: scope resolved with the user.** Under "connect + reuse existing query builders" the only clean end-to-end (connect **and** query) win was D1. For deeper coverage the user then chose to relax "no bespoke query vocab" for four high-value plugins, each built as an injection-safe closed vocabulary + security council:

| Milestone | Commit | Notes |
|-----------|--------|-------|
| D1 — Oracle + Amazon Redshift datasources | `25bdd15406` | same host/port/dbAuth builder + reuse create_query. Snowflake/Databricks deferred (bespoke connection shape). |
| Redis query builder (`create_redis_query`) | `2e3b45f261` | **council: APPROVE** — allow-listed commands, single-token args; one command always (jedis). |
| AI query builder (`create_ai_query`, OpenAI/Anthropic/Google AI) | `224e903308` | **council: APPROVE-w-RISKS** — provider-aware chat formData; appsmithAi excluded per user. |
| S3 query builder (`create_s3_query`) | `1226dc8ed8` | **council: APPROVE** — list/read/upload/delete, smartSubstitution-parameterized (Mongo-pattern clone). |
| GraphQL query builder (`create_graphql_query`) | `78ced6bcff` | **council: APPROVE-w-RISKS** — operation string ({{-gated) + parameterized variables; consistent with create_rest_api. |

All four query builders are **PROVISIONAL** pending live-DP verification (their tool descriptions say so) — the connection for Redis/S3/AI/GraphQL is created in the Appsmith UI (credentials/OAuth never touch MCP), then queried by datasourceId, mirroring the create_sheets_query precedent.

**Not pursued (documented decision):** D2 REST-auth (would require MCP to carry secrets — refused by design); the remaining D3 NoSQL (dynamo/firestore/elasticsearch/arango) and D4 (smtp/lambda) and D6 SaaS each need bespoke connection shapes AND bespoke query vocabularies with no reuse path, and most need credentials/OAuth — out of scope under the agreed constraints. Snowflake/Databricks (bespoke connection config).

---

## Current coverage (baseline)

**Widgets wrapped (18):** text, input, select, button, image, table, container, form, modal, datepicker, chart, tabs, list, checkbox, switch, radio, multiselect, filepicker.

**Datasources creatable (6):** postgres, mysql, sqlserver, rest, mongo, googlesheets.

**Query builders:** SQL (`create_query`), Mongo, Sheets, REST.

---

## Part A — Widgets (~30 to add)

Each widget needs: (1) a spec shape in `builder/schema.ts` `widgetSpecSchema` (safe props only, reusing the binding vocabulary), (2) a `WIDGET_TEMPLATES` entry in `builder/templates.ts` (Appsmith DSL blueprint: appsmithType, version, footprint, default props, build fn), (3) a `WIDGET_CATALOG` entry + guide copy in `capabilities.ts`/`instructions.ts`, (4) tests. Bindings (`source`, `value`, event wiring, `visibleWhen`) extend to the new widgets where they apply.

### Milestone W1 — Simple display widgets
`statbox` (STATBOX_WIDGET — composite canvas blueprint, KPI card), `richtext` (RICH_TEXT_EDITOR_WIDGET), `divider` (DIVIDER_WIDGET), `progress` (PROGRESS_WIDGET), `circularprogress` (CIRCULAR_PROGRESS_WIDGET), `rate` (RATE_WIDGET), `iconbutton` (ICON_BUTTON_WIDGET). Low prop surface; statbox is the headline (dashboard KPI). No remote content.

### Milestone W2 — Embed/media widgets (remote content — security-relevant)
`iframe` (IFRAME_WIDGET), `video` (VIDEO_WIDGET), `audio` (AUDIO_WIDGET), `documentviewer` (DOCUMENT_VIEWER_WIDGET). These render agent-supplied URLs in the viewer's browser → SSRF/embedding surface. Restrict `source`/`url` to `http(s)` absolute URLs (no `javascript:`/`data:`), and confirm the existing static-image URL posture. Security review required for this milestone specifically.

### Milestone W3 — Input widgets
`currencyinput` (CURRENCY_INPUT_WIDGET), `phoneinput` (PHONE_INPUT_WIDGET), `numberslider` (NUMBER_SLIDER_WIDGET), `categoryslider` (CATEGORY_SLIDER_WIDGET), `rangeslider` (RANGE_SLIDER_WIDGET), `checkboxgroup` (CHECKBOX_GROUP_WIDGET), `switchgroup` (SWITCH_GROUP_WIDGET). Reuse the input/select validation + options + selected-value binding patterns.

### Milestone W4 — Action / nav widgets
`menubutton` (MENU_BUTTON_WIDGET — menu items each wire to the event vocabulary), `buttongroup` (BUTTON_GROUP_WIDGET). Extend `wire_event` to their per-item/per-button events.

### Milestone W5 — Tree selects + JSON form
`multiselecttree` (MULTI_SELECT_TREE_WIDGET), `singleselecttree` (SINGLE_SELECT_TREE_WIDGET), `jsonform` (JSON_FORM_WIDGET — schema-driven; the biggest single-widget effort, bind `sourceData` to a query and let Appsmith infer fields, or accept a closed field schema).

### Milestone W6 — Device-capture widgets
`camera` (CAMERA_WIDGET), `audiorecorder` (AUDIO_RECORDER_WIDGET), `codescanner` (CODE_SCANNER_WIDGET). Capture → value; wire their onChange/onScan events.

### Milestone W7 — Maps
`map` (MAP_WIDGET — needs the instance's Google Maps key; degrade gracefully when absent), `mapchart` (MAP_CHART_WIDGET). Bind markers/data to a query.

---

## Part B — Table & Chart depth

### Milestone T1 — Table column vocabulary
Wrap TableWidgetV2's `primaryColumns`/`columnTypeMap`: per-column type (text, number, date, image, video, url, button, menuButton, iconButton, select/dropdown, checkbox, switch), computed columns (folds in the formula AST with a `currentRow` leaf — supersedes task C2), and cell formatting (alignment, text color, cell background, conditional color by value via the predicate/formula vocabulary). This is the highest-value app-building milestone.

### Milestone Ch1 — Chart depth
Multi-series (bind several query series), all fixed chart types (line/bar/pie/column/area), and axis/legend/label config from a closed option set. Exclude CUSTOM_FUSION.

---

## Part C — Datasources (~18 to add, excluding appsmithAi)

Each datasource needs: (1) `create_datasource` wrapping (connection shell; credentials are entered by the user in Appsmith, never through MCP — the established pattern), (2) a structured query builder for that plugin's query shape.

### Milestone D1 — SQL-family databases (cheap: reuse the SQL query builder)
`oracle`, `redshift`, `snowflake`, `databricks`. All speak SQL; point the existing structured SQL `create_query` at them + add the datasource types. Lowest effort, high enterprise value.

### Milestone D2 — REST depth
Extend `create_rest_api` / `create_datasource` REST to the plugin's real auth config (bearer, API-key header, OAuth2 client-credentials) and pagination — all present in the REST plugin `form.json`. Credentials still entered in Appsmith.

### Milestone D3 — NoSQL / search datasources
`redis`, `dynamo`, `firestore`, `elasticSearch`, `arangoDB`. Each has its own structured query shape (Redis commands, Dynamo operations, ES query DSL) — a closed per-plugin query vocabulary, no raw strings.

### Milestone D4 — Cloud / messaging
`amazons3` (bucket ops), `smtp` (send email), `awsLambda` (invoke), `graphql` (structured query + variables).

### Milestone D5 — AI datasources
`openAi`, `anthropic`, `googleAi` — datasource + a structured "run prompt" query. Highest novelty: agents can build AI-powered apps (summarize/classify/extract).

### Milestone D6 — SaaS connector
`saas` generic plugin (Salesforce/Hubspot/etc.) — the most bespoke; may land as a thin "connect + run named action" wrapper.

---

## Execution approach

- **Sequence:** W1 → W3 → W4 → W2 (security-gated) → T1 → Ch1 → D1 → D2 → W5/W6/W7 → D3 → D4 → D5 → D6. Front-load the high-value, low-risk milestones (simple widgets, table depth, SQL DBs); slot the security-relevant ones (media embeds, AI, SaaS) where a focused review is warranted.
- **Per-milestone:** TDD, then a right-sized council — architect + QA on every milestone; **security only where a milestone introduces a real surface** (remote content in W2/W7, credential/egress in the datasource milestones, AI egress in D5). Widgets that are inert display/input do not need a security pass.
- **Commit per milestone**; keep each independently shippable and green (types, lint, tests) before moving on.
- Update this doc's checkboxes as milestones land.

## Status
- [ ] W1 simple display  · [ ] W2 media  · [ ] W3 inputs  · [ ] W4 action/nav  · [ ] W5 tree/jsonform  · [ ] W6 capture  · [ ] W7 maps
- [ ] T1 table columns  · [ ] Ch1 charts
- [ ] D1 SQL DBs  · [ ] D2 REST depth  · [ ] D3 NoSQL  · [ ] D4 cloud  · [ ] D5 AI  · [ ] D6 SaaS
