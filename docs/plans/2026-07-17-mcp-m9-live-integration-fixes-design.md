# MCP M9 — Live-integration fixes (findings from the first real end-to-end run)

Date: 2026-07-17
Status: DRAFT — pending design council (senior-architect, security-reviewer; product-planner for the workflow gap)
Origin: first live run of the MCP against a REAL local Appsmith server (not mocks). Three
integration bugs the entire unit suite missed because the affected API calls are mocked.

## Ground truth (verified live against the running server + Java source)

1. **`getApplication` calls a dead route.** The wrapper (app.ts ~611) does
   `GET /api/v1/applications/{id}`. `ApplicationControllerCE` has NO `@GetMapping("/{id}")`
   (only /home, /view/{id}, /export/{id}, ...) → the server returns **405 "GET not supported"**
   (confirmed with a real applicationId; `/applications/home` returns 400 not 405, proving it's
   that specific path). So `getApplication` throws on every call.
2. `ApplicationPagesDTO` (returned by `getApplicationPages`, i.e.
   `GET /api/v1/pages?applicationId=...&mode=EDIT`, which the MCP already calls with **200**)
   has an `Application application` field — the full Application, which carries
   `gitApplicationMetadata` for git-connected apps (absent for non-git) — AND its `pages` carry
   page `slug`s. This is the correct, already-working source.
3. The git `/metadata` endpoint exists but **403s for non-git apps**, so it is NOT a clean
   source for read_git_status (which must answer for non-git apps too).
4. Page `layoutId` is not returned by build_application, read_pages, or the pages DTO's page
   objects; yet get_application_context/read_semantic_page/edit_page/patch_widgets/wire_event
   all REQUIRE it as input. (Implementer to confirm the source — likely the individual page
   fetch `GET /api/v1/pages/{pageId}` returning `layouts[0].id`.)

## Impact (CORRECTED per council + live verification)

- **[P1] EVERY mutation on EVERY app is refused** — the branch gate (`gitBranchGate` →
  `gateGitState`) is fail-CLOSED, and `getApplication` 405s for all apps, so `gateGitState`
  returns `git_state_unknown` and REFUSES. LIVE-CONFIRMED: `patch_widgets` on a plain non-git
  app returned `git_state_unknown` ("could not verify the application's git state; retry"). So
  you can `build_application` (no gate) but cannot edit ANY app (edit_page/patch_widgets/
  wire_event/update_theme/create_page/... all 15+ gated mutation tools). NOT a silent bypass —
  a total fail-safe breakage of the editing surface. (My earlier "fail-open bypass" framing was
  wrong; corrected.)
- read_git_status always returns `git_state_unknown`; create_branch/prepare_commit/confirm_commit
  and confirm_publish (all read via getApplication) are broken too.
- All missed by unit tests because getApplication is mocked.

### The five getApplication consumers (architect + security) — all git-state reads, none needs
the full Application:
1. `fetchGitState` (~1317) — fail-OPEN advisory, used only by read-only `get_application_context`.
2. `gateGitState` (~1611) → `gitBranchGate` (~1630) — fail-CLOSED, the ACTUAL branch gate at
   ~15-20 mutation call sites.
3. `read_git_status` (~2125).
4. `confirm_publish` (~3116) — fail-CLOSED publish refusal (also reads `application.name`).
5. `freshMcpCommitBranch` (~3455) — fail-CLOSED commit gate.
- **[P2] build_application never returns editorUrl/viewerUrl** — the import response's pages lack
  slugs, so applicationUrls always omits them. The M5 fix for ChatGPT's "no link" complaint
  never fires in reality.
- **[P2] No way to obtain layoutId** → the core authoring tools are unusable after a fresh build
  without an out-of-band id.

## Fixes

### F1 — Redefine the SINGLE getApplication wrapper (architect's prescribed method)
- **Redefine the `getApplication` wrapper (app.ts ~611)** to
  `async (id) => (await request('/api/v1/pages?applicationId=<id>&mode=EDIT')).application`
  (i.e. return the pages DTO's `.application` SUB-OBJECT). This auto-corrects ALL FIVE consumers
  with each keeping its own try/catch → the fail-open (fetchGitState) vs fail-closed
  (gateGitState, confirm_publish, freshMcpCommitBranch) split is preserved BY CONSTRUCTION; no
  call site is edited. `.application` carries `gitApplicationMetadata`, `name`, `slug`, so
  gitStateOf/gitMetadataOf and confirm_publish's `application.name` read keep working unchanged.
- **[SECURITY, HIGH — BLOCK condition] Feed `.application`, NEVER the whole DTO.** If the wrapper
  returned the whole `ApplicationPagesDTO`, `.gitApplicationMetadata` is undefined → connected:
  false → git apps silently read "not connected" → the gate/commit/publish refusals silently
  disable → recreates the exact bypass. The wrapper MUST return `.application`.
- **[SECURITY, HIGH — BLOCK condition] No raw passthrough.** No F1 path may return raw
  `.application` / `.gitApplicationMetadata` / `remoteUrl` to the agent. `read_git_status` output
  stays built from `GitMetadataProjection`; `remoteUrl` (a Public JsonView field that may embed
  `user:token@host` credentials) stays reduced to host via `remoteHostOf`.
- Keep getGitStatus (clean/dirty, ahead/behind) and getGitProtectedBranches — those endpoints
  work; only the metadata source moves.
- **[SECURITY] Required unit tests from a realistically NESTED fixture** (captured from a real
  200 pages-DTO response): (a) git DTO → connected:true + correct branchName → gate ENGAGES and
  refuses a wrong/missing branch; (b) non-git DTO → connected:false (NOT an error); (c) a
  throwing source → mutation refused with git_state_unknown; (d) a `user:token@host` remoteUrl
  surfaces ONLY as remoteHost. Assert at the real gate/commit sites, not just gitStateOf.

### F2 — Return editor/viewer URLs from build by sourcing page slugs from the pages DTO
- **Reuse the existing `applicationUrlsFromPages` helper (~1038)** — do NOT write new slug
  extraction. **Reuse the governed build path's EXISTING `getApplicationPages(applicationId)`
  call (~2343)** (today only fingerprinted for the revision) to feed it; add the extra
  getApplicationPages call ONLY on the ungoverned branch. Origin rules unchanged; omit only if
  slugs are genuinely absent.

### F3 — Surface layoutId so authoring tools are usable
- Source: `GET /api/v1/pages/{pageId}` → `layouts[0].id` (PageDTO.layouts; the pages-LIST DTO
  does not carry it — confirmed by architect). Add a `getPageLayouts` wrapper.
- Include `layoutId` in the build_application `pages[]` result (default page → 1 extra fetch,
  cheap) and in read_pages. **[architect: N+1]** read_pages must fetch per page — state this
  cost; pages/app are few. Update tool docs: build/read_pages → layoutId →
  read_semantic_page/patch_widgets/edit_page/wire_event.

### F5 — Route-contract test (prevents the whole M9 bug class from recurring)
The M9 bugs slipped through because unit tests mock the API wrappers, so a wrapper URL that hits
a non-existent server route (getApplication → 405) is invisible. A pure mock cannot catch a
mock that encodes a wrong assumption. F5 adds a **deterministic, server-free contract test** that
cross-checks the MCP's outbound calls against the real Spring routes:
- **MCP side:** enumerate every `request(...)` call in `createAppsmithApi` — its HTTP verb (GET
  default; POST/PUT/DELETE from the options arg) and path template, query string stripped, path
  params normalized to a placeholder (e.g. `{id}`).
- **Server side:** parse the Java controllers' route annotations
  (`@GetMapping`/`@PostMapping`/`@PutMapping`/`@DeleteMapping`/`@RequestMapping`) plus the
  class-level base path (resolve the `Url.*` constants from the constants file), building the set
  of served `(verb, normalized-path)` under `/api/v1`.
- **Assert:** every MCP `(verb, path)` is covered by some server route. FAIL with a clear message
  naming the offending wrapper + path.
- This test FAILS on the pre-fix `getApplication` (`GET /api/v1/applications/{id}` — no such GET)
  and PASSES after F1 (the wrapper now hits `GET /api/v1/pages` which exists) — a built-in proof.
- Scope realistically: cover the controllers the MCP actually calls (application, pages, git,
  layouts, actions, datasources, workspaces, themes, users). If resolving a base-path constant is
  infeasible, hardcode that controller's known base with a comment — the goal is catching
  verb/path drift, not a perfect parser. Document any endpoint deliberately excluded.
- Built AFTER F1/F2/F3 land (shares the mcp package), committed WITH M9.

### F4 (separate, assess) — MCP-auth rate-limit shared-bucket lockout
- Java-side (RateLimitConfig): the mcp_authentication bucket keys on the loopback source, so a
  bad-token burst locks out valid tokens (5/min). Reproduced live. This is HARDENING, not a
  correctness bug, and is server-side — recommend a SEPARATE task (per-real-client keying via a
  forwarded client identifier), NOT bundled into M9. Council to confirm the split.

### Done already
- APPSMITH_MCP_INTERNAL_SECRET documented in .env.example (mcp_ tokens fail locally without it,
  matched on both the MCP service and the Java server).

## Verification

- Unit tests: update the mocked shapes (getApplicationPages now the git-metadata source; the
  mocks must return `application.gitApplicationMetadata`), add coverage for the non-git path
  (connected:false, not an error), the git path (branchName → gate engages), URL-from-slug, and
  layoutId surfacing. Existing 783 must stay green (with mock-shape updates).
- **Live regression (the gap the mocks left):** re-run the live harness
  (packages/mcp/live-harness.mjs) against the local server — read_git_status must return
  connected:false for a non-git app (NOT git_state_unknown), build must return an editorUrl, and
  read_pages must include a layoutId that read_semantic_page accepts. HONEST LIMITATION: the
  git-CONNECTED path (gate engaging on a real git app, commit) can't be fully exercised locally
  without connecting an app to a git remote; it relies on unit tests + the DTO structural
  confirmation. Flag this in the report.

## Sequencing
F1 (security-critical) → F3 (unblocks authoring) → F2 (URLs). F4 tracked separately. Full
council (architect + security mandatory; product for F3 UX) before commit.
