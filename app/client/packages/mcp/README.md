# Appsmith MCP server

An embedded [Model Context Protocol](https://modelcontextprotocol.io) server that lets an MCP client (e.g. an LLM
agent) build and edit Appsmith applications through a safe, structured API. It runs on `127.0.0.1:8092`, is fronted by
Caddy at `/mcp`, and authenticates callers with per-user bearer tokens (`mcp_…`) issued from **Profile → MCP tokens**.

Agents never author raw widget DSL, SQL, JS, or `{{ }}` bindings — they call tools and the server compiles them under
the caller's own permissions (the closed-vocabulary invariant). Every tool call stays bounded by the caller's ACL, and
mutating/destructive operations go through a prepare/confirm handshake.

## Release notes

### Authenticated MCP surface — on by default

The MCP server, its **data layer** (datasource discovery + structured SQL/REST query creation + action reads), and
**restricted JS objects** are all **enabled by default** on new and upgraded deployments. The data-layer security
review these were previously gated behind is complete. The authenticated surface is reachable only with a valid,
user-scoped `mcp_…` token that the user explicitly creates.

**How to disable.** Each layer stays an Admin off-switch (Admin Settings → Configuration, or the environment variables
below). Disabling `APPSMITH_MCP_ENABLED` is enforced server-side: the auth filter is evaluated per request, so once the
setting change is applied, already-issued `mcp_…` tokens are rejected (401) rather than merely losing the `/mcp` route.
(Applying the change restarts the backend process, which re-reads the configuration.)

| Variable                    | Default | Effect when disabled                                                            |
| --------------------------- | ------- | ------------------------------------------------------------------------------- |
| `APPSMITH_MCP_ENABLED`      | on      | The `/mcp` route is dropped and `mcp_…` bearer tokens are rejected server-side. |
| `APPSMITH_MCP_DATA_ENABLED` | on      | Datasource/query tools are unregistered; spec authoring + reads remain.         |
| `APPSMITH_MCP_JS_ENABLED`   | on      | Restricted JS-object tools are unregistered.                                    |

Governed and destructive tools additionally require a MongoDB + Redis backend (`APPSMITH_MONGODB_URI` /
`APPSMITH_DB_URL` and `APPSMITH_REDIS_URL`); without them the server starts with read + spec-authoring tools only.

### Session limits

Sessions are bounded per instance and per user, with an idle TTL. When a user starts a session beyond their cap, the
server evicts that user's own least-recently-active session instead of rejecting the new one — so clients that
reconnect without cleanly closing (dropped SSE streams, proxy timeouts) are never locked out by their own stale
sessions. The instance-wide cap stays a hard limit (HTTP 503), since evicting across users would let one user
displace another's sessions. All three limits are tunable; invalid or unset values fall back to the defaults, and
values above the sanity ceilings (10000 sessions, 24 h TTL) are clamped — both with a startup warning.

| Variable                             | Default         | Effect                                                               |
| ------------------------------------ | --------------- | -------------------------------------------------------------------- |
| `APPSMITH_MCP_MAX_SESSIONS`          | 100             | Instance-wide cap on concurrent MCP sessions (hard 503 when full).   |
| `APPSMITH_MCP_MAX_SESSIONS_PER_USER` | 25              | Per-user cap; at the cap the user's oldest session is evicted.       |
| `APPSMITH_MCP_SESSION_TTL_MS`        | 900000 (15 min) | Idle session lifetime; every request on a session refreshes its TTL. |

### Auto-publish on creation, and application URLs

`build_application` **automatically publishes (deploys) the app it just created** and returns an `editorUrl` and
`viewerUrl` for the default page, so the agent can hand the user a working link immediately.

- **New apps only.** Auto-publish applies solely to the app created by that same call — a brand-new app has no
  existing deployed state to clobber. **Re-publishing** an existing app (including that app after later edits) keeps
  the governed `prepare_publish` → `confirm_publish` flow (Mongo + Redis backend required), which also refuses to
  publish git-connected apps. When governance is configured, the auto-publish itself is recorded as a change record;
  on ungoverned deployments it emits a structured `appsmith_mcp_auto_publish` log event, so a deploy is never silent.
- **Publishing does not make the app public.** `isPublic` is a separate ACL switch; publishing only materializes the
  viewer copy for users who already have access to the app. Admins should note that newly created (possibly
  half-built) apps therefore become visible in view mode to workspace members with access — the agent is instructed
  to finish wiring and re-publish before sharing the viewer link, since the auto-published copy is just a scaffold.
- **Publish failures never fail the create.** The app is still created; the result carries a
  `warnings: ["created but not deployed: …"]` entry with a coarse failure class (never the raw error).

The absolute origin for the returned URLs resolves in this order, failing closed to root-relative paths
(`/app/<appSlug>/<pageSlug>-<pageId>/edit`):

1. `APPSMITH_MCP_PUBLIC_ORIGIN`, when set to a valid bare http(s) origin (scheme + host + optional port; no path,
   query, fragment, or credentials — an invalid value is dropped with a startup warning).
2. Otherwise, per session from the initialize request's `X-Forwarded-Proto` (must be exactly `http`/`https`) and
   `Host` headers (charset-checked, and required to be in `APPSMITH_MCP_ALLOWED_HOSTS` when that allowlist is set).
3. Otherwise root-relative URLs — never a guessed absolute origin. If the import response lacks slugs, the URLs are
   omitted and the ids are still returned.

| Variable                     | Default | Effect                                                                                   |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `APPSMITH_MCP_PUBLIC_ORIGIN` | unset   | Preferred absolute origin for `editorUrl`/`viewerUrl` (e.g. `https://apps.example.com`). |

### Git awareness (M7): status reads, a branch gate, agent branches, and governed commits

**BREAKING for agents editing git-connected apps.** Every mutating tool that targets an application (layout edits,
events, theme/page changes, query/action/JS-object mutations) now takes a `branch` parameter. For a git-connected
app it is **required** and must equal the target app's current branch; a missing or mismatched value fails with
`git_branch_required` / `git_branch_changed` carrying the current branch, so recovery is a single retry. The gate
read **fails closed**: when the app's git state cannot be read, the mutation is rejected (`git_state_unknown`)
instead of proceeding. Previously, edits on git apps proceeded with only an advisory warning. Non-git apps are
unaffected — the parameter is optional and ignored.

- **`read_git_status` (always on).** A whitelist projection of the app's git state: connection, current/default
  branch, clean/dirty with modified-entity counts, protected branches, and the remote **host only** — never
  `gitAuth`, keys, or the full remote URL. `compareRemote: true` (default **false**) opts into a remote fetch for
  `aheadCount`/`behindCount`.
- **`create_branch` (governed).** Creates an agent branch under the **reserved `mcp/` namespace** (byte-exact
  prefix; remainder `[A-Za-z0-9_-]{1,60}`; at most 5 `mcp/` branches per application). **Creating a branch PUSHES
  the new ref to the customer's git remote under the instance deploy key** — remote CI/webhooks configured to run
  on branch pushes will run on `mcp/*` refs; operators should account for that egress. Appsmith is
  branch-per-application and has no checkout, so the result returns the **new branched `applicationId`**; all
  subsequent edits for that branch must target it. A human branch named `mcp/*` falls inside the reserved agent
  namespace — keep human branches out of it. Agents never delete branches; humans remove stale `mcp/` branches via
  Appsmith's branch UI.
- **`prepare_commit` / `confirm_commit` (governed): commit implies push.** Appsmith's commit API **always pushes to
  the customer's git remote after the local commit** — there is no commit-without-push and no separate push
  endpoint. Because of that, MCP commits are allowed **only on `mcp/` agent branches**: both tools refuse unless a
  fresh, fail-closed read shows the target app's branch is byte-exact `mcp/`-prefixed (`confirm_commit` re-reads at
  confirm time; any other branch fails with `git_commit_branch_forbidden`). The commit message is one printable
  line (max 200 characters; control and Unicode bidi/format characters rejected; must not start with `[`) and the
  server prepends a non-strippable `[mcp] ` marker, so agent-authored commits are always identifiable in git
  history. Author/committer identity always derives from the session user server-side — the MCP never sends author
  fields — and amend is pinned off. A missing git author profile fails with an error telling the user to set it in
  Appsmith.

  **Human approval and elicitation.** `prepare_commit` returns a one-time confirmation (5-minute TTL, bound to the
  app, branch, message, and current content revision — drift between prepare and confirm fails) plus relay text the
  agent must show the user. On MCP clients that declare **elicitation** support, `confirm_commit` prompts the human
  directly ("Commit ALL current changes on branch mcp/… and PUSH to the remote?"); only an explicit accept
  proceeds, and decline/cancel/timeout leave the confirmation unconsumed (bounded at 3 prompts per confirmation,
  after which it is invalidated). **Honest fallback:** without an elicitation-capable client the confirmation
  prompt depends on the agent relaying it — the one-time token and relay text are the fallback posture, and no
  server rule (mcp/-only, TTL, one-time token, content binding) relaxes either way. Client support for elicitation
  varies (e.g. VS Code and some desktop MCP clients support it; many others do not yet) — operators should assume
  the fallback posture unless they know their client. Note for operators: an approved commit pushes to your remote
  under the instance deploy key, so remote CI/webhooks watching branch pushes will run on `mcp/*` commits.

  Publishing from MCP remains disabled for git apps: the deliverable is the `mcp/` branch and its branch-scoped
  review URL — the user reviews on the branch, merges via Appsmith's branch UI or a pull request on the remote,
  then deletes the `mcp/` branch.

## Local development

Copy `.env.example` to `.env` and run the package standalone. See that file for the full set of variables.
