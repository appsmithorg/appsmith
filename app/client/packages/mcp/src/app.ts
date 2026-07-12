import { randomUUID, timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getCapabilities } from "./builder/capabilities.js";
import { applyEdit, compileApp } from "./builder/compile.js";
import {
  FIELDS_FORMAT,
  GUIDES,
  type InstructionDoc,
  RECIPES,
  scaffoldCrudPlan,
  scaffoldFormPlan,
  WIDGET_REFERENCE,
} from "./builder/instructions.js";
import type { WidgetNode } from "./builder/layout.js";
import { lintArtifact, lintDsl } from "./builder/lint.js";
import { listPresets, PRESETS } from "./builder/presets.js";
import {
  buildActionDto,
  compileQuery,
  querySpecSchema,
} from "./builder/query.js";
import { appSpecSchema, editSpecSchema } from "./builder/schema.js";

const MAX_ID_LENGTH = 128;

export const MAX_ARTIFACT_BYTES = 1024 * 1024;
export const MAX_REQUEST_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_MCP_SESSIONS = 100;
export const MAX_MCP_SESSIONS_PER_USER = 10;
export const MCP_SESSION_TTL_MS = 15 * 60 * 1000;
export const REQUEST_TIMEOUT_MS = 30 * 1000;
export const HEADERS_TIMEOUT_MS = 10 * 1000;
export const MAX_INBOUND_CONNECTIONS = 512;
const MCP_TOKEN_PREFIX = "mcp_";
const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ID_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/);
const artifactSchema = z.record(z.unknown()).superRefine((artifact, ctx) => {
  try {
    serializeArtifact(artifact);
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        error instanceof Error ? error.message : "Artifact must be valid JSON",
    });
  }
});

interface ApiResponse<T> {
  data: T;
  responseMeta?: { success?: boolean };
}

export interface AppsmithApi {
  getApplicationContext: (
    applicationId: string,
    pageId: string,
    layoutId: string,
  ) => Promise<{ pages: unknown; page: unknown; layout: unknown }>;
  listApplications: (workspaceId: string) => Promise<unknown>;
  listWorkspaces: () => Promise<unknown>;
  importApplicationArtifact: (
    workspaceId: string,
    artifact: Record<string, unknown>,
  ) => Promise<unknown>;
  importPartialApplicationArtifact: (
    workspaceId: string,
    applicationId: string,
    pageId: string,
    artifact: Record<string, unknown>,
  ) => Promise<unknown>;
  updateLayout: (
    applicationId: string,
    pageId: string,
    layoutId: string,
    dsl: Record<string, unknown>,
  ) => Promise<unknown>;
  listDatasources: (workspaceId: string) => Promise<unknown>;
  getDatasourceStructure: (datasourceId: string) => Promise<unknown>;
  getApplication: (applicationId: string) => Promise<unknown>;
  listActions: (applicationId: string) => Promise<unknown>;
  createAction: (action: Record<string, unknown>) => Promise<unknown>;
  validateToken: () => Promise<unknown>;
}

function serializeArtifact(artifact: Record<string, unknown>): string {
  if (Object.keys(artifact).length === 0) {
    throw new Error("Artifact must not be empty");
  }

  const seen = new WeakSet<object>();
  const serialized = JSON.stringify(
    artifact,
    function (this: Record<string, unknown>, _key, value) {
      // JSON.stringify applies toJSON() before the replacer runs, so inspect the
      // original value via the holder to reject Date and other non-plain objects
      // that would otherwise be silently coerced to a string (e.g. an ISO date).
      const original = this[_key];

      if (
        original !== null &&
        typeof original === "object" &&
        typeof (original as { toJSON?: unknown }).toJSON === "function"
      ) {
        throw new Error("Artifact must contain only plain JSON objects");
      }

      if (
        value === undefined ||
        typeof value === "bigint" ||
        typeof value === "function" ||
        typeof value === "symbol" ||
        (typeof value === "number" && !Number.isFinite(value))
      ) {
        throw new Error("Artifact must contain only JSON values");
      }

      if (value && typeof value === "object") {
        const prototype = Object.getPrototypeOf(value);

        if (
          !Array.isArray(value) &&
          prototype !== Object.prototype &&
          prototype !== null
        ) {
          throw new Error("Artifact must contain only plain JSON objects");
        }

        if (seen.has(value)) {
          throw new Error("Artifact must not contain circular references");
        }

        seen.add(value);
      }

      return value;
    },
  );

  if (
    !serialized ||
    Buffer.byteLength(serialized, "utf8") > MAX_ARTIFACT_BYTES
  ) {
    throw new Error(`Artifact must not exceed ${MAX_ARTIFACT_BYTES} bytes`);
  }

  return serialized;
}

function artifactUpload(artifact: Record<string, unknown>): FormData {
  const parsedArtifact = artifactSchema.parse(artifact);
  const body = serializeArtifact(parsedArtifact);
  const file = new Blob([body], { type: "application/json" });
  const formData = new FormData();

  formData.append("file", file, "appsmith-artifact.json");

  return formData;
}

export function createAppsmithApi(
  token: string,
  apiBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): AppsmithApi {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const isMultipart = init?.body instanceof FormData;
    // Bound every upstream call so a hung Appsmith response cannot pin an MCP worker indefinitely. Preserve a
    // caller-supplied signal when present; otherwise abort on our own timeout.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetchFn(`${apiBaseUrl}${path}`, {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isMultipart ? {} : { "Content-Type": "application/json" }),
          ...init?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Appsmith API request failed (${response.status})`);
      }

      return ((await response.json()) as ApiResponse<T>).data;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    listWorkspaces: async () => request("/api/v1/workspaces"),
    listApplications: async (workspaceId) =>
      request(
        `/api/v1/applications/home?workspaceId=${encodeURIComponent(workspaceId)}`,
      ),
    getApplicationContext: async (applicationId, pageId, layoutId) => {
      const [pages, page, layout] = await Promise.all([
        request(
          `/api/v1/pages?applicationId=${encodeURIComponent(applicationId)}`,
        ),
        request(`/api/v1/pages/${encodeURIComponent(pageId)}`),
        request(
          `/api/v1/layouts/${encodeURIComponent(layoutId)}/pages/${encodeURIComponent(pageId)}`,
        ),
      ]);

      return { pages, page, layout };
    },
    importApplicationArtifact: async (workspaceId, artifact) =>
      request(
        `/api/v1/applications/import/${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          body: artifactUpload(artifact),
        },
      ),
    importPartialApplicationArtifact: async (
      workspaceId,
      applicationId,
      pageId,
      artifact,
    ) =>
      request(
        `/api/v1/applications/import/partial/${encodeURIComponent(workspaceId)}/${encodeURIComponent(applicationId)}?pageId=${encodeURIComponent(pageId)}`,
        {
          method: "POST",
          body: artifactUpload(artifact),
        },
      ),
    updateLayout: async (applicationId, pageId, layoutId, dsl) =>
      request(
        `/api/v1/layouts/${encodeURIComponent(layoutId)}/pages/${encodeURIComponent(pageId)}?applicationId=${encodeURIComponent(applicationId)}`,
        {
          method: "PUT",
          body: JSON.stringify({ dsl }),
        },
      ),
    listDatasources: async (workspaceId) =>
      request(
        `/api/v1/datasources?workspaceId=${encodeURIComponent(workspaceId)}`,
      ),
    getDatasourceStructure: async (datasourceId) =>
      request(
        `/api/v1/datasources/${encodeURIComponent(datasourceId)}/structure`,
      ),
    getApplication: async (applicationId) =>
      request(`/api/v1/applications/${encodeURIComponent(applicationId)}`),
    listActions: async (applicationId) =>
      request(
        `/api/v1/actions?applicationId=${encodeURIComponent(applicationId)}`,
      ),
    createAction: async (action) =>
      request("/api/v1/actions", {
        method: "POST",
        body: JSON.stringify(action),
      }),
    validateToken: async () => request("/api/v1/users/me"),
  };
}

// Least-privilege projection for list_datasources: the agent only needs enough to identify a datasource and author a
// binding, so we forward a fixed whitelist of non-secret discovery fields and drop everything else. This is a
// belt-and-braces egress guard on top of the server's JsonView secret-masking — a future server change can't leak
// credentials/host details into the LLM's context through this tool, because only these keys are ever passed on.
const DATASOURCE_PUBLIC_FIELDS = [
  "id",
  "name",
  "pluginId",
  "pluginName",
  "workspaceId",
  "type",
] as const;

function projectDatasources(response: unknown): unknown {
  const project = (entry: unknown) => {
    if (!entry || typeof entry !== "object") return entry;

    const source = entry as Record<string, unknown>;
    const projected: Record<string, unknown> = {};

    for (const field of DATASOURCE_PUBLIC_FIELDS) {
      if (source[field] !== undefined) projected[field] = source[field];
    }

    return projected;
  };

  return Array.isArray(response) ? response.map(project) : project(response);
}

// IDOR guard for create_query: the referenced datasource must be one the caller can actually access in the given
// workspace (the server's create path fetches the datasource without a permission check — TODO in NewActionService —
// so we cross-check here before POST).
function datasourceAccessible(list: unknown, datasourceId: string): boolean {
  return (
    Array.isArray(list) &&
    list.some(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        (entry as { id?: unknown }).id === datasourceId,
    )
  );
}

// Idempotency lookup: an existing action on the same page with the same name (the server rejects duplicates, so we
// return the existing one instead of erroring on a retry).
function findExistingAction(
  list: unknown,
  name: string,
  pageId: string,
): unknown {
  if (!Array.isArray(list)) return undefined;

  return list.find((entry) => {
    if (entry === null || typeof entry !== "object") return false;

    const action = entry as {
      name?: unknown;
      pageId?: unknown;
      unpublishedAction?: { pageId?: unknown };
    };
    const actionPageId = action.pageId ?? action.unpublishedAction?.pageId;

    return (
      action.name === name &&
      (actionPageId === undefined || actionPageId === pageId)
    );
  });
}

function validationError(issues: z.ZodIssue[]) {
  return result({
    valid: false,
    errors: issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

// The compiler enforces aggregate caps (depth, total widgets) and serializeArtifact enforces size/plain-JSON; surface
// those as clean validation errors instead of letting them become a 500.
function compileError(error: unknown) {
  return result({
    valid: false,
    errors: [
      {
        path: "",
        message: error instanceof Error ? error.message : "compilation failed",
      },
    ],
  });
}

function result(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function buildMcpServer(api: AppsmithApi, dataEnabled = false) {
  const server = new McpServer({ name: "appsmith-mcp", version: "0.0.1" });

  server.tool(
    "list_workspaces",
    "List workspaces accessible to the authenticated Appsmith user.",
    {},
    async () => result(await api.listWorkspaces()),
  );

  server.tool(
    "list_applications",
    "List applications in a workspace accessible to the authenticated Appsmith user.",
    { workspaceId: idSchema },
    async ({ workspaceId }) => result(await api.listApplications(workspaceId)),
  );

  server.tool(
    "get_application_context",
    "Read the requested application page and layout. Appsmith authorizes every API request using the caller's bearer token.",
    { applicationId: idSchema, pageId: idSchema, layoutId: idSchema },
    async ({ applicationId, layoutId, pageId }) =>
      result(await api.getApplicationContext(applicationId, pageId, layoutId)),
  );

  // The raw artifact-import tools were removed: they let an agent upload an arbitrary artifact (custom JS libs, JS
  // objects, datasources) — a large content-injection surface. Authoring goes through the validated
  // build_application / edit_page spec compiler instead.

  server.tool(
    "get_capabilities",
    "Discover what the app builder supports: widget types, the page/app/edit spec shapes, presets, and the layout grid. Call this first when building an app.",
    {},
    async () => result(getCapabilities()),
  );

  server.tool(
    "list_presets",
    "List ready-made page-spec presets (form, table-detail, card-grid, crud) that can be adapted into an app spec.",
    {},
    async () => result(listPresets()),
  );

  server.tool(
    "get_preset",
    "Get a preset page spec by name to use or adapt.",
    { name: z.string().trim().min(1) },
    async ({ name }) => {
      const preset = PRESETS[name];

      if (!preset) {
        return result({
          error: `unknown preset "${name}"`,
          available: Object.keys(PRESETS),
        });
      }

      return result(preset);
    },
  );

  server.tool(
    "validate_app_spec",
    "Dry-run: validate and compile an app spec WITHOUT creating anything. Returns structured errors, or a summary of what would be built. Use this to iterate before build_application.",
    { app: z.record(z.unknown()) },
    async ({ app }) => {
      const parsed = appSpecSchema.safeParse(app);

      if (!parsed.success) {
        return validationError(parsed.error.issues);
      }

      try {
        compileApp(parsed.data);
      } catch (error) {
        return compileError(error);
      }

      return result({
        valid: true,
        application: parsed.data.name,
        pages: parsed.data.pages.map((page) => ({
          name: page.name,
          widgets: page.widgets.length,
        })),
      });
    },
  );

  server.tool(
    "build_application",
    "Create an Appsmith application from a high-level app spec. Widgets are auto-placed on the grid, compiled to an artifact, and imported via the caller's ACL-enforced permissions.",
    { workspaceId: idSchema, app: z.record(z.unknown()) },
    async ({ app, workspaceId }) => {
      const parsed = appSpecSchema.safeParse(app);

      if (!parsed.success) {
        return validationError(parsed.error.issues);
      }

      let artifact: Record<string, unknown>;

      try {
        artifact = compileApp(parsed.data);
      } catch (error) {
        return compileError(error);
      }

      // Structural diagnostics on the exact artifact being imported, returned inline so the agent gets feedback
      // without a second call (build -> inspect -> fix loop).
      const diagnostics = lintArtifact(artifact);
      const imported = await api.importApplicationArtifact(
        workspaceId,
        artifact,
      );

      return result({ application: imported, diagnostics });
    },
  );

  server.tool(
    "edit_page",
    "Append widgets to an existing page from a high-level edit spec, with best-effort placement (after a widget / inside a container). Existing widgets are never modified. Returns notes about how placement was resolved.",
    {
      applicationId: idSchema,
      pageId: idSchema,
      layoutId: idSchema,
      edit: z.record(z.unknown()),
    },
    async ({ applicationId, edit, layoutId, pageId }) => {
      const parsed = editSpecSchema.safeParse(edit);

      if (!parsed.success) {
        return validationError(parsed.error.issues);
      }

      const context = await api.getApplicationContext(
        applicationId,
        pageId,
        layoutId,
      );
      const currentDsl = (context.layout as { dsl?: WidgetNode } | undefined)
        ?.dsl;

      if (!currentDsl) {
        return result({ error: "could not read the current page layout" });
      }

      let dsl: WidgetNode;
      let notes: string[];

      try {
        ({ dsl, notes } = applyEdit(currentDsl, parsed.data));
        // Guard the write path with the same size + plain-JSON check the import path uses.
        serializeArtifact(dsl as Record<string, unknown>);
      } catch (error) {
        return compileError(error);
      }

      const updated = await api.updateLayout(
        applicationId,
        pageId,
        layoutId,
        dsl,
      );

      const diagnostics = lintDsl(dsl);

      return result({ notes, diagnostics, layout: updated });
    },
  );

  server.tool(
    "inspect_page",
    "Lint a live page and return structural diagnostics (overlaps, off-grid widgets, clipped containers, duplicate names, dangling bindings). Use this to verify a build/edit and drive fixes. Read-only.",
    { applicationId: idSchema, pageId: idSchema, layoutId: idSchema },
    async ({ applicationId, layoutId, pageId }) => {
      const context = await api.getApplicationContext(
        applicationId,
        pageId,
        layoutId,
      );
      const dsl = (context.layout as { dsl?: WidgetNode } | undefined)?.dsl;

      if (!dsl) {
        return result({ error: "could not read the current page layout" });
      }

      return result({ diagnostics: lintDsl(dsl) });
    },
  );

  // M4 data layer — gated behind APPSMITH_MCP_DATA_ENABLED. These read tools let an agent discover the datasources
  // and structure it can bind widgets to (via the closed binding vocabulary: table.source / button.onClick). They
  // wrap the existing ACL-enforced Appsmith REST endpoints under the caller's bearer token; no new server surface.
  if (dataEnabled) {
    server.tool(
      "list_datasources",
      "List datasources in a workspace that the authenticated user can access. Bind a table to one of these via a query name (table.source = { query }).",
      { workspaceId: idSchema },
      async ({ workspaceId }) =>
        result(projectDatasources(await api.listDatasources(workspaceId))),
    );

    server.tool(
      "get_datasource_structure",
      "Read a datasource's structure (tables/columns) so you can shape queries and bindings. Read-only.",
      { datasourceId: idSchema },
      async ({ datasourceId }) =>
        result(await api.getDatasourceStructure(datasourceId)),
    );

    server.tool(
      "create_query",
      "Create a SQL query (SELECT/INSERT/UPDATE/DELETE) on a datasource from a STRUCTURED spec — no raw SQL, no raw bindings. Values become prepared-statement parameters. Widgets then reference it by name (table.source={query} / button.onClick={run}). Idempotent by page + name.",
      { query: z.record(z.unknown()) },
      async ({ query }) => {
        const parsed = querySpecSchema.safeParse(query);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;

        // Resolve the workspace SERVER-AUTHORITATIVELY from the application — never trust an agent-supplied
        // workspaceId — so a datasource can only be bound within the target page's own workspace (cross-tenant guard).
        const application = (await api.getApplication(spec.applicationId)) as {
          workspaceId?: string;
        };
        const workspaceId = application?.workspaceId;

        if (typeof workspaceId !== "string") {
          return result({
            error: `could not resolve the workspace for application ${spec.applicationId}`,
          });
        }

        // IDOR guard: only bind a datasource the caller can access in the page's own workspace.
        const datasources = await api.listDatasources(workspaceId);

        if (!datasourceAccessible(datasources, spec.datasourceId)) {
          return result({
            error: `datasource ${spec.datasourceId} is not accessible in this application's workspace`,
          });
        }

        // Idempotency: return the existing query rather than creating a duplicate on retry.
        const existing = findExistingAction(
          await api.listActions(spec.applicationId),
          spec.name,
          spec.pageId,
        );

        if (existing !== undefined) {
          return result({
            created: false,
            reason: "a query with this name already exists on this page",
            action: existing,
          });
        }

        let body: string;

        try {
          body = compileQuery(spec);
        } catch (error) {
          return compileError(error);
        }

        const created = await api.createAction(buildActionDto(spec, body));

        return result({ created: true, body, action: created });
      },
    );
  }

  registerInstructions(server);

  return server;
}

// M2 — register instruction sets as MCP resources (reference/guides/recipes) and prompts (guided workflows), so an
// agent can pull guidance through the protocol instead of only through tool output. All content is static text.
function registerInstructions(server: McpServer): void {
  const markdown = "text/markdown";

  const registerDoc = (prefix: string, doc: InstructionDoc) => {
    const uri = `appsmith://${prefix}/${doc.slug}`;

    server.registerResource(
      `${prefix}-${doc.slug}`,
      uri,
      { title: doc.title, description: doc.description, mimeType: markdown },
      async () => ({
        contents: [{ uri, mimeType: markdown, text: doc.render() }],
      }),
    );
  };

  registerDoc("reference", WIDGET_REFERENCE);

  for (const guide of GUIDES) registerDoc("guide", guide);

  for (const recipe of RECIPES) registerDoc("recipe", recipe);

  const promptArgs = {
    entity: z.string().trim().min(1).max(64),
    fields: z.string().max(2000).optional(),
  };

  server.registerPrompt(
    "scaffold_crud",
    {
      title: "Scaffold a CRUD page",
      description: `Guided workflow to build a table + details form for an entity. fields: ${FIELDS_FORMAT}`,
      argsSchema: promptArgs,
    },
    ({ entity, fields }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: scaffoldCrudPlan(entity, fields ?? ""),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "scaffold_form",
    {
      title: "Scaffold a form page",
      description: `Guided workflow to build a labelled input form. fields: ${FIELDS_FORMAT}`,
      argsSchema: promptArgs,
    },
    ({ entity, fields }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: scaffoldFormPlan(entity, fields ?? ""),
          },
        },
      ],
    }),
  );
}

export function bearerToken(req: IncomingMessage): string | undefined {
  const value = req.headers.authorization;
  const match = value?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim();
}

function writeJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let byteLength = 0;

  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);

    byteLength += buffer.byteLength;

    if (byteLength > MAX_REQUEST_BODY_BYTES) {
      throw new HttpError(413, "request body too large");
    }

    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid JSON request body");
  }
}

interface McpSession {
  expiresAt: number;
  token: string;
  username: string;
  transport: StreamableHTTPServerTransport;
}

export interface McpHttpServerOptions {
  maxSessions?: number;
  maxSessionsPerUser?: number;
  now?: () => number;
  sessionTtlMs?: number;
  // Gate for the M4 data layer (APPSMITH_MCP_DATA_ENABLED). Off by default: data tools are not registered.
  dataEnabled?: boolean;
}

function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.byteLength === rightBuffer.byteLength &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createMcpHttpServer(
  apiBaseUrl: string,
  createApi: (token: string) => AppsmithApi = (token) =>
    createAppsmithApi(token, apiBaseUrl),
  options: McpHttpServerOptions = {},
): Server {
  const sessions = new Map<string, McpSession>();
  // Reservations bridge the async gap between admitting an initialize and the session registering in
  // onsessioninitialized, so concurrent initializes cannot all pass the caps before any of them registers.
  let pendingTotal = 0;
  const pendingByUser = new Map<string, number>();
  const maxSessions = options.maxSessions ?? MAX_MCP_SESSIONS;
  const maxSessionsPerUser =
    options.maxSessionsPerUser ?? MAX_MCP_SESSIONS_PER_USER;
  const now = options.now ?? Date.now;
  const sessionTtlMs = options.sessionTtlMs ?? MCP_SESSION_TTL_MS;
  const dataEnabled = options.dataEnabled ?? false;

  function removeExpiredSessions() {
    const currentTime = now();

    for (const [id, session] of sessions) {
      if (session.expiresAt <= currentTime) {
        sessions.delete(id);
        void session.transport.close().catch(() => {});
      }
    }
  }

  async function authenticatedUsername(api: AppsmithApi): Promise<string> {
    let profile: { username?: string; isAnonymous?: boolean };

    try {
      profile = (await api.validateToken()) as {
        username?: string;
        isAnonymous?: boolean;
      };
    } catch {
      throw new HttpError(401, "invalid bearer token");
    }

    if (!profile || profile.isAnonymous === true || !profile.username) {
      throw new HttpError(401, "invalid bearer token");
    }

    return profile.username;
  }

  const server = createServer(async (req, res) => {
    // Released in `finally`; holds a session reservation across the admission → registration gap.
    let releasePending = () => {};

    try {
      const path = (req.url ?? "").split("?")[0];

      if (path === "/health") {
        writeJson(res, 200, { status: "ok" });

        return;
      }

      if (path !== "/mcp") {
        writeJson(res, 404, { error: "not found" });

        return;
      }

      // This endpoint serves programmatic MCP clients, not browsers. A cross-site page could otherwise use DNS
      // rebinding to reach the loopback service, so reject any request that carries a browser Origin header.
      if (req.headers.origin !== undefined) {
        writeJson(res, 403, { error: "cross-origin requests are not allowed" });

        return;
      }

      const token = bearerToken(req);

      if (!token || !token.startsWith(MCP_TOKEN_PREFIX)) {
        res.writeHead(401, { "WWW-Authenticate": "Bearer" });
        res.end();

        return;
      }

      removeExpiredSessions();

      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      const session = sessionId ? sessions.get(sessionId) : undefined;
      const body = req.method === "POST" ? await readBody(req) : undefined;
      let transport = session?.transport;

      if (session) {
        if (!tokensMatch(session.token, token)) {
          // Do NOT evict the session here: a mismatched token must not let someone who guessed/leaked a session id
          // tear down the real owner's session (targeted DoS). The owner's own token still binds it.
          writeJson(res, 401, { error: "invalid MCP session" });

          return;
        }

        await authenticatedUsername(createApi(token));
        session.expiresAt = now() + sessionTtlMs;
      }

      if (!transport && isInitializeRequest(body)) {
        const api = createApi(token);
        const username = await authenticatedUsername(api);

        // Check-and-reserve synchronously (no await between reading the counts and incrementing the reservation)
        // so a burst of concurrent initializes can't all slip past the caps. `sessions.size + pendingTotal` counts
        // both registered and in-flight sessions.
        let userSessionCount = pendingByUser.get(username) ?? 0;

        for (const existing of sessions.values()) {
          if (existing.username === username) userSessionCount += 1;
        }

        if (sessions.size + pendingTotal >= maxSessions) {
          writeJson(res, 503, { error: "MCP session limit reached" });

          return;
        }

        if (userSessionCount >= maxSessionsPerUser) {
          writeJson(res, 429, {
            error: "MCP session limit reached for this user",
          });

          return;
        }

        pendingTotal += 1;
        pendingByUser.set(username, (pendingByUser.get(username) ?? 0) + 1);
        releasePending = () => {
          releasePending = () => {};
          pendingTotal -= 1;
          const remaining = (pendingByUser.get(username) ?? 1) - 1;

          if (remaining <= 0) pendingByUser.delete(username);
          else pendingByUser.set(username, remaining);
        };

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          onsessioninitialized: (id) => {
            sessions.set(id, {
              expiresAt: now() + sessionTtlMs,
              token,
              username,
              transport: transport!,
            });
            // Release the reservation the moment the session is registered — the initialize response is a
            // long-lived SSE stream, so waiting for `finally` (end of handleRequest) would let a client that
            // never drains the stream pin the reservation until the session TTL and saturate the caps.
            releasePending();
          },
        });
        transport.onclose = () => {
          if (transport?.sessionId) sessions.delete(transport.sessionId);
        };
        await buildMcpServer(api, dataEnabled).connect(transport);
      }

      if (!transport) {
        writeJson(res, 400, { error: "initialize the MCP session first" });

        return;
      }

      await transport.handleRequest(req, res, body);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        error instanceof HttpError ? error.message : "MCP request failed";

      writeJson(res, status, { error: message });
    } finally {
      // By now the session has either registered (counted in `sessions`) or failed; release the reservation.
      releasePending();
    }
  });

  // Bound inbound sockets so a slow-loris or a flood of half-open connections can't pin the single process.
  server.maxConnections = MAX_INBOUND_CONNECTIONS;
  server.requestTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;

  return server;
}
