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

## Local development

Copy `.env.example` to `.env` and run the package standalone. See that file for the full set of variables.
