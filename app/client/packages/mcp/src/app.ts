import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
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
import {
  buildDuplicateActionDto,
  buildUpdateActionDto,
  deleteActionSpecSchema,
  duplicateActionSpecSchema,
  updateActionSpecSchema,
} from "./builder/actionPatch.js";
import { getCapabilities } from "./builder/capabilities.js";
import { applyEdit, compileApp } from "./builder/compile.js";
import {
  applyEvent,
  eventReferences,
  widgetExists,
  wireEventSpecSchema,
} from "./builder/events.js";
import { applyWidgetPatch, widgetPatchSchema } from "./builder/editPatch.js";
import {
  FIELDS_FORMAT,
  GUIDES,
  type InstructionDoc,
  RECIPES,
  scaffoldCrudPlan,
  scaffoldFormPlan,
  SERVER_INSTRUCTIONS,
  WIDGET_REFERENCE,
} from "./builder/instructions.js";
import type { WidgetNode } from "./builder/layout.js";
import { lintArtifact, lintDsl } from "./builder/lint.js";
import {
  buildCreateJsObjectRequest,
  buildUpdateJsObjectRequest,
  createJsObjectSpecSchema,
  deleteJsObjectSpecSchema,
  updateJsObjectSpecSchema,
} from "./builder/jsObject.js";
import {
  buildCreatePageRequest,
  buildRenamePageRequest,
  createPageSpecSchema,
  deletePageSpecSchema,
  renamePageSpecSchema,
} from "./builder/pages.js";
import { listPresets, PRESETS } from "./builder/presets.js";
import {
  buildActionDto,
  compileQuery,
  querySpecSchema,
} from "./builder/query.js";
import {
  buildRestActionDto,
  compileRestApi,
  restApiSpecSchema,
} from "./builder/restApi.js";
import {
  canonicalStableSerialize,
  fingerprintDsl,
  projectSemanticPage,
} from "./builder/semantic.js";
import {
  buildThemeUpdatePayload,
  projectTheme,
  themePatchSchema,
} from "./builder/theme.js";
import { appSpecSchema, editSpecSchema } from "./builder/schema.js";
import {
  DestructiveConfirmationError,
  GovernanceLockError,
  GovernanceRevisionConflictError,
  type McpChangeRecord,
  type McpGovernanceCoordinator,
} from "./governance/coordinator.js";

// Safe audit-record projection for the history tools: never returns the rollback snapshot (it can hold full DSL) —
// only metadata and the semantic summary, plus whether a safe rollback exists.
function isLayoutRollbackable(change: McpChangeRecord): boolean {
  const rollback = change.rollback as { kind?: unknown; dsl?: unknown };

  return rollback?.kind === "layout" && rollback.dsl !== undefined;
}

function projectChange(change: McpChangeRecord): Record<string, unknown> {
  return {
    id: change.id,
    operation: change.operation,
    entityKey: change.entityKey,
    revisionBefore: change.revisionBefore,
    revisionAfter: change.revisionAfter,
    createdAt: change.createdAt,
    summary: change.summary,
    rollbackAvailable: isLayoutRollbackable(change),
  };
}

// Context passed to every tool handler: which gated tool families are enabled, the governance coordinator (present
// only when Mongo+Redis are configured), and the authenticated MCP username used as the governance actor identity.
export interface ServerContext {
  dataEnabled: boolean;
  jsEnabled: boolean;
  governance?: McpGovernanceCoordinator;
  actorId: string;
}

// A page is the lock/audit entity for layout, page-metadata, and event mutations.
function pageEntityKey(applicationId: string, pageId: string): string {
  return `page:${applicationId}:${pageId}`;
}

// The application's page list is the lock/revision entity for page-list mutations (create/rename/delete page).
function pagesEntityKey(applicationId: string): string {
  return `application:${applicationId}:pages`;
}

// Binds a destructive confirmation to the exact operation payload so a token can only confirm the specific change it
// was prepared for (not a different page/action).
function operationDigest(payload: unknown): string {
  return createHash("sha256")
    .update(canonicalStableSerialize(payload), "utf8")
    .digest("hex");
}

interface ToolResult {
  content: { type: "text"; text: string }[];
  // Matches the SDK's CallToolResult, which carries an index signature. Without this an `interface` (unlike a type
  // alias) is not assignable to it, so governed tool handlers returning ToolResult fail to typecheck.
  [key: string]: unknown;
}

// Map governance failures to a stable, safe MCP error payload so agents get a consistent stale/busy/confirmation
// signal instead of an opaque 500. Returns undefined for non-governance errors (let the caller handle those).
function governanceError(error: unknown): ToolResult | undefined {
  if (error instanceof GovernanceRevisionConflictError) {
    return result({
      error:
        "page revision is stale; re-read the entity before retrying this mutation",
      code: "revision_conflict",
    });
  }

  if (error instanceof GovernanceLockError) {
    return result({
      error: "this entity is currently being changed; retry shortly",
      code: "entity_locked",
    });
  }

  if (error instanceof DestructiveConfirmationError) {
    return result({ error: error.message, code: "confirmation_invalid" });
  }

  return undefined;
}

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
  createDatasource: (datasource: Record<string, unknown>) => Promise<unknown>;
  getDatasourceStructure: (datasourceId: string) => Promise<unknown>;
  getApplicationPages: (applicationId: string) => Promise<unknown>;
  // Fetches the application document, whose gitApplicationMetadata reveals whether the app is connected to git and
  // which branch is checked out — used to guard mutations/publish on git-connected apps.
  getApplication: (applicationId: string) => Promise<unknown>;
  listActions: (applicationId: string) => Promise<unknown>;
  createAction: (action: Record<string, unknown>) => Promise<unknown>;
  getAction: (applicationId: string, actionId: string) => Promise<unknown>;
  updateAction: (
    actionId: string,
    action: Record<string, unknown>,
  ) => Promise<unknown>;
  deleteAction: (actionId: string) => Promise<unknown>;
  executeAction: (actionId: string) => Promise<unknown>;
  getCurrentTheme: (applicationId: string) => Promise<unknown>;
  updateTheme: (
    applicationId: string,
    theme: Record<string, unknown>,
  ) => Promise<unknown>;
  createPage: (body: Record<string, unknown>) => Promise<unknown>;
  updatePage: (
    pageId: string,
    body: Record<string, unknown>,
  ) => Promise<unknown>;
  deletePage: (pageId: string) => Promise<unknown>;
  publishApplication: (applicationId: string) => Promise<unknown>;
  // workspaceId is a REQUIRED request param on GET /api/v1/plugins; omitting it is a 400.
  listPlugins: (workspaceId: string) => Promise<unknown>;
  listActionCollections: (applicationId: string) => Promise<unknown>;
  createActionCollection: (body: Record<string, unknown>) => Promise<unknown>;
  updateActionCollection: (
    collectionId: string,
    body: Record<string, unknown>,
  ) => Promise<unknown>;
  deleteActionCollection: (collectionId: string) => Promise<unknown>;
  validateToken: () => Promise<unknown>;
}

function serializeArtifact(artifact: Record<string, unknown>): string {
  if (Object.keys(artifact).length === 0) {
    throw new Error("Artifact must not be empty");
  }

  let serialized: string;

  try {
    serialized = JSON.stringify(
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
        }

        return value;
      },
    );
  } catch (error) {
    // A genuine cycle (an object reachable from itself) makes JSON.stringify throw a TypeError; shared
    // references that form a DAG serialize fine (they are valid JSON, just duplicated). Only the former is an error.
    if (error instanceof TypeError && /circular|cyclic/i.test(error.message)) {
      throw new Error("Artifact must not contain circular references");
    }

    throw error;
  }

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
  correlationHeaders: Record<string, string> = {},
): AppsmithApi {
  // Internal marker that tells the Appsmith backend this /api/v1 call originates from the trusted loopback MCP
  // service (decision D2). Sourced ONLY from this process's own env — never copied from an inbound client request —
  // and added alongside Authorization. When unset the header is omitted, so the backend fails closed (an mcp_ token
  // without a valid marker is rejected 401). Caddy strips any inbound copy of this header on ingress.
  const internalMarker = process.env.APPSMITH_MCP_INTERNAL_SECRET;

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
          // These are server-to-server calls authenticated by a bearer token, with no cookies, so they carry no
          // CSRF exposure. Appsmith's CSRF filter exempts JSON POSTs but not multipart (e.g. artifact import); this
          // header is the documented exemption so import/upload requests aren't denied.
          "X-Requested-By": "Appsmith",
          ...(isMultipart ? {} : { "Content-Type": "application/json" }),
          ...correlationHeaders,
          ...init?.headers,
          // Spread LAST so the env-sourced marker always wins: no correlation header or caller-supplied init.header
          // can override or inject the trusted internal marker (constraint: never sourced from an inbound request).
          ...(internalMarker
            ? { "X-Appsmith-Mcp-Internal": internalMarker }
            : {}),
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
    // The user's accessible workspaces come from /workspaces/home; a plain GET /workspaces collides with the
    // create (POST) mapping and returns 405.
    listWorkspaces: async () => request("/api/v1/workspaces/home"),
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
    createDatasource: async (datasource) =>
      request("/api/v1/datasources", {
        method: "POST",
        body: JSON.stringify(datasource),
      }),
    getDatasourceStructure: async (datasourceId) =>
      request(
        `/api/v1/datasources/${encodeURIComponent(datasourceId)}/structure`,
      ),
    getApplicationPages: async (applicationId) =>
      request(
        `/api/v1/pages?applicationId=${encodeURIComponent(applicationId)}&mode=EDIT`,
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
    getAction: async (applicationId, actionId) => {
      // There is no GET /actions/{id} (that path is PUT/DELETE only, so a GET 405s). Fetch the application's
      // actions and select by id.
      const actions = await request<unknown>(
        `/api/v1/actions?applicationId=${encodeURIComponent(applicationId)}`,
      );
      const match = Array.isArray(actions)
        ? actions.find(
            (entry) =>
              entry !== null &&
              typeof entry === "object" &&
              (entry as { id?: unknown }).id === actionId,
          )
        : undefined;

      if (match === undefined) {
        throw new Error(
          `action ${actionId} was not found in application ${applicationId}`,
        );
      }

      return match;
    },
    updateAction: async (actionId, action) =>
      request(`/api/v1/actions/${encodeURIComponent(actionId)}`, {
        method: "PUT",
        body: JSON.stringify(action),
      }),
    deleteAction: async (actionId) =>
      request(`/api/v1/actions/${encodeURIComponent(actionId)}`, {
        method: "DELETE",
      }),
    executeAction: async (actionId) => {
      // Execute a STORED action by id only. The agent never supplies an execute payload, so this cannot proxy
      // arbitrary parameters/body — the server runs the persisted action under the caller's ACL.
      const formData = new FormData();

      formData.append(
        "executeActionDTO",
        JSON.stringify({ actionId, viewMode: false }),
      );

      return request("/api/v1/actions/execute", {
        method: "POST",
        body: formData,
      });
    },
    getCurrentTheme: async (applicationId) =>
      request(
        `/api/v1/themes/applications/${encodeURIComponent(applicationId)}/current?mode=EDIT`,
      ),
    updateTheme: async (applicationId, theme) =>
      request(
        `/api/v1/themes/applications/${encodeURIComponent(applicationId)}`,
        { method: "PUT", body: JSON.stringify(theme) },
      ),
    createPage: async (body) =>
      request("/api/v1/pages", { method: "POST", body: JSON.stringify(body) }),
    updatePage: async (pageId, body) =>
      request(`/api/v1/pages/${encodeURIComponent(pageId)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    deletePage: async (pageId) =>
      request(`/api/v1/pages/${encodeURIComponent(pageId)}`, {
        method: "DELETE",
      }),
    publishApplication: async (applicationId) =>
      request(
        `/api/v1/applications/publish/${encodeURIComponent(applicationId)}`,
        { method: "POST" },
      ),
    listPlugins: async (workspaceId) =>
      request(`/api/v1/plugins?workspaceId=${encodeURIComponent(workspaceId)}`),
    listActionCollections: async (applicationId) =>
      request(
        `/api/v1/collections/actions?applicationId=${encodeURIComponent(applicationId)}`,
      ),
    createActionCollection: async (body) =>
      request("/api/v1/collections/actions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateActionCollection: async (collectionId, body) =>
      request(
        `/api/v1/collections/actions/${encodeURIComponent(collectionId)}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      ),
    deleteActionCollection: async (collectionId) =>
      request(
        `/api/v1/collections/actions/${encodeURIComponent(collectionId)}`,
        { method: "DELETE" },
      ),
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

// `create_query` emits SQL and relies on the SQL plugin prepared-statement
// contract. Do not accept another plugin merely because it has a datasource
// identifier: REST, GraphQL, Mongo, and Sheets need their own typed builders.
const SQL_PLUGIN_IDS = new Set([
  "mariadb-plugin",
  "mssql-plugin",
  "mysql-plugin",
  "oracle-plugin",
  "postgres-plugin",
  "snowflake-plugin",
]);
const REST_PLUGIN_IDS = new Set(["restapi-plugin"]);

// CE keys every datasource storage under this fixed environment id (FieldNameCE.UNUSED_ENVIRONMENT_ID).
const DEFAULT_ENVIRONMENT_ID = "unused_env";

// The closed set of plugin families create_datasource can provision. All three share the endpoints + dbAuth
// configuration shape (verified against each plugin's form.json). Credentials are never part of the vocabulary.
const CREATABLE_DATASOURCE_PLUGINS: Record<
  "postgresql" | "mysql" | "mssql",
  { packageName: string; defaultPort: number }
> = {
  postgresql: { packageName: "postgres-plugin", defaultPort: 5432 },
  mysql: { packageName: "mysql-plugin", defaultPort: 3306 },
  mssql: { packageName: "mssql-plugin", defaultPort: 1433 },
};

const REST_DATASOURCE_PACKAGE_NAME = "restapi-plugin";

// A REST base URL: http(s) only, and no whitespace, template/binding syntax, quotes, backticks, or angle brackets
// so it can't carry injection into the stored config. The value is the datasource's own base URL (not a secret);
// egress/SSRF at execution time is enforced by the existing server-side REST-plugin guards, unchanged here.
const restBaseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .regex(
    /^https?:\/\/[^\s{}<>"'`\\]+$/i,
    "url must be an http(s) base URL with no whitespace or template syntax",
  );

function pluginIdByPackageName(
  plugins: unknown,
  packageName: string,
): string | undefined {
  const match = Array.isArray(plugins)
    ? plugins.find(
        (plugin) =>
          plugin !== null &&
          typeof plugin === "object" &&
          (plugin as { packageName?: unknown }).packageName === packageName,
      )
    : undefined;
  const id = (match as { id?: unknown } | undefined)?.id;

  return typeof id === "string" ? id : undefined;
}

function findDatasourceNamed(list: unknown, name: string): unknown {
  if (!Array.isArray(list)) return undefined;

  return list.find(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      (entry as { name?: unknown }).name === name,
  );
}

// The credential hand-off: MCP never carries secrets, so the human finishes configuration in the Appsmith UI. This
// is the same flow as importing an app whose datasources arrive unconfigured.
function datasourceNextStep(name: string): {
  needsCredentials: true;
  nextStep: string;
} {
  return {
    needsCredentials: true,
    nextStep: `Ask the user to open Appsmith -> workspace -> Datasources -> "${name}", enter the database password (and any missing details), then click "Test configuration" and save. Credentials are intentionally never accepted through MCP.`,
  };
}

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

// IDOR guard for action creation: the referenced datasource must be one the caller can actually access in the given
// workspace. The server also verifies execute permission; this check keeps the MCP response deterministic and scoped.
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

// Datasource.pluginId is the plugin DOCUMENT id (a per-instance Mongo id), not the stable packageName, so family
// checks must resolve the id through the workspace's plugin list. A datasource whose pluginId happens to BE a
// packageName (test fixtures) also resolves, keeping the check robust either way.
function pluginPackageName(
  plugins: unknown,
  pluginId: unknown,
): string | undefined {
  if (typeof pluginId !== "string") return undefined;

  const match = Array.isArray(plugins)
    ? plugins.find(
        (plugin) =>
          plugin !== null &&
          typeof plugin === "object" &&
          (plugin as { id?: unknown }).id === pluginId,
      )
    : undefined;
  const packageName = (match as { packageName?: unknown } | undefined)
    ?.packageName;

  return typeof packageName === "string" ? packageName : pluginId;
}

function datasourceInPluginFamily(
  list: unknown,
  plugins: unknown,
  datasourceId: string,
  family: Set<string>,
): boolean {
  if (!Array.isArray(list)) return false;

  return list.some((entry) => {
    if (entry === null || typeof entry !== "object") return false;

    const datasource = entry as { id?: unknown; pluginId?: unknown };

    if (datasource.id !== datasourceId) return false;

    const packageName = pluginPackageName(plugins, datasource.pluginId);

    return packageName !== undefined && family.has(packageName);
  });
}

function isSqlDatasource(
  list: unknown,
  plugins: unknown,
  datasourceId: string,
): boolean {
  return datasourceInPluginFamily(list, plugins, datasourceId, SQL_PLUGIN_IDS);
}

function isRestDatasource(
  list: unknown,
  plugins: unknown,
  datasourceId: string,
): boolean {
  return datasourceInPluginFamily(list, plugins, datasourceId, REST_PLUGIN_IDS);
}

function workspaceIdFromApplicationPages(
  response: unknown,
): string | undefined {
  if (response === null || typeof response !== "object") return undefined;

  const pages = response as {
    workspaceId?: unknown;
    application?: { workspaceId?: unknown };
  };
  const workspaceId = pages.workspaceId ?? pages.application?.workspaceId;

  return typeof workspaceId === "string" ? workspaceId : undefined;
}

// Safe page-list metadata: never returns DSL, actions, or bindings — only identity/name/slug/visibility. This is
// both the read projection and the basis for the page-list revision used for optimistic concurrency on page CRUD.
function projectPages(
  response: unknown,
): { id: string; name: string; slug?: string; isHidden?: boolean }[] {
  const pages = (response as { pages?: unknown } | null)?.pages;

  if (!Array.isArray(pages)) return [];

  return pages
    .filter((page) => page !== null && typeof page === "object")
    .map((page) => {
      const entry = page as {
        id?: unknown;
        name?: unknown;
        slug?: unknown;
        isHidden?: unknown;
      };

      return {
        id: String(entry.id ?? ""),
        name: String(entry.name ?? ""),
        ...(typeof entry.slug === "string" ? { slug: entry.slug } : {}),
        ...(typeof entry.isHidden === "boolean"
          ? { isHidden: entry.isHidden }
          : {}),
      };
    });
}

function fingerprintPages(response: unknown): string {
  return createHash("sha256")
    .update(canonicalStableSerialize(projectPages(response)), "utf8")
    .digest("hex");
}

// Safe projection + revision for a single stored action. The revision folds in the server-side `updatedAt` so any
// change to the (never-exposed) action body still bumps it, giving real optimistic concurrency without leaking the
// body/headers/credentials.
function projectAction(action: unknown): Record<string, unknown> {
  return (projectActions([action])[0] as Record<string, unknown>) ?? {};
}

function actionUpdatedAt(action: unknown): unknown {
  const entry = action as {
    updatedAt?: unknown;
    unpublishedAction?: { updatedAt?: unknown };
  } | null;

  return entry?.updatedAt ?? entry?.unpublishedAction?.updatedAt;
}

function fingerprintAction(action: unknown): string {
  return createHash("sha256")
    .update(
      canonicalStableSerialize({
        ...projectAction(action),
        updatedAt: actionUpdatedAt(action),
      }),
      "utf8",
    )
    .digest("hex");
}

// Plugin families whose egress is pinned server-side to a configured datasource host, so executing an action cannot
// exfiltrate query-bound data to an attacker-chosen endpoint. REST/API-family plugins (API, SAAS, REMOTE, GraphQL)
// can target an arbitrary external URL and are therefore NOT host-restricted.
const HOST_RESTRICTED_PLUGIN_TYPES = new Set(["DB"]);

function actionSource(action: unknown): Record<string, unknown> | null {
  const source =
    (action as { unpublishedAction?: unknown } | null)?.unpublishedAction ??
    action;

  return (source as Record<string, unknown> | null) ?? null;
}

// True when the action can egress to an arbitrary external host (its datasource is not server-side host-restricted).
// Such an action must never auto-run: even a GET could carry query-bound data out to an attacker-chosen URL with no
// human in the loop (M1-T2). Absence of a pluginType is treated as external (safe default).
function isExternalEgressAction(action: unknown): boolean {
  const pluginType = actionSource(action)?.pluginType;

  return (
    typeof pluginType !== "string" ||
    !HOST_RESTRICTED_PLUGIN_TYPES.has(pluginType)
  );
}

// Classify a stored action as auto-runnable (executable via run_action WITHOUT the prepare/confirm human checkpoint).
// TWO independent guarantees are required, and no current plugin family provides both — so nothing auto-runs today and
// every stored action routes through prepare_run_action / confirm_run_action:
//   (1) PROTOCOL-level read-only: a REST GET/HEAD (safe by HTTP semantics). A DB/SQL body can NEVER be reliably
//       classified read-only from its text — a leading SELECT/WITH/SHOW/EXPLAIN can still mutate (a CTE such as
//       `WITH x AS (DELETE FROM t RETURNING *) SELECT * FROM x`, a mutating function like `SELECT drop_old()`, or
//       `EXPLAIN ANALYZE <mutation>` which executes the plan). So DB actions fail (1).
//   (2) HOST-RESTRICTED datasource: egress pinned server-side, so a run can't exfiltrate to an external host. REST/API
//       actions (the only ones that satisfy (1)) can target any external URL, so they fail (2) (M1-T2).
// The predicate keeps an explicit, auditable door for a future host-restricted, protocol-read-only plugin, rather than
// widening auto-run today. Defaults to NON-auto-runnable (safe).
function isReadOnlyAction(action: unknown): boolean {
  const config = (
    actionSource(action) as {
      actionConfiguration?: { httpMethod?: unknown };
    } | null
  )?.actionConfiguration;
  const method = config?.httpMethod;

  const protocolReadOnly =
    typeof method === "string" &&
    ["GET", "HEAD"].includes(method.toUpperCase());

  return protocolReadOnly && !isExternalEgressAction(action);
}

// Git-connection state of an application, read from its gitApplicationMetadata. When an app is connected to git, MCP
// edits land as UNCOMMITTED changes on the checked-out branch and confirm_publish would deploy that uncommitted
// state. So publish is refused and mutating edits carry a warning naming the branch (M1-T3).
interface GitState {
  connected: boolean;
  branchName?: string;
}

function gitStateOf(application: unknown): GitState {
  const meta = (application as { gitApplicationMetadata?: unknown } | null)
    ?.gitApplicationMetadata as
    | { branchName?: unknown; remoteUrl?: unknown }
    | null
    | undefined;

  if (!meta) return { connected: false };

  const branchName =
    typeof meta.branchName === "string" && meta.branchName.length > 0
      ? meta.branchName
      : undefined;
  // A live connection carries a remoteUrl (and usually a branch). A bare metadata stub (neither) is not connected.
  const connected =
    (typeof meta.remoteUrl === "string" && meta.remoteUrl.length > 0) ||
    branchName !== undefined;

  return { connected, branchName };
}

// Fetches the application and returns its git state. Fails safe to "not connected" on a read error so a transient
// failure never blocks a legitimate edit; confirm_publish re-reads explicitly before the high-impact deploy.
async function fetchGitState(
  api: AppsmithApi,
  applicationId: string,
): Promise<GitState> {
  try {
    return gitStateOf(await api.getApplication(applicationId));
  } catch {
    return { connected: false };
  }
}

// Human-readable warning attached to a mutating edit's result when the target app is git-connected: the change is
// uncommitted on the named branch and must be committed via Appsmith's git UI before it ships.
function gitEditWarning(git: GitState): string | undefined {
  if (!git.connected) return undefined;

  const branch = git.branchName ? ` on branch "${git.branchName}"` : "";

  return `This application is connected to git. This change is saved as an UNCOMMITTED edit${branch}; commit it via Appsmith's git UI to include it in a deploy. Publishing from MCP is disabled for git-connected apps.`;
}

// Clone a STORED action (server data, not agent input) under a new name, keeping only the permitted fields and
// preserving its datasource by id. The agent never supplies action configuration here.
function cloneActionForDuplicate(
  stored: unknown,
  newName: string,
): Record<string, unknown> {
  const source =
    (stored as { unpublishedAction?: unknown } | null)?.unpublishedAction ??
    stored;
  const entry = source as {
    pageId?: unknown;
    pluginId?: unknown;
    actionConfiguration?: unknown;
    datasource?: { id?: unknown };
  };

  return {
    name: newName,
    ...(entry.pageId !== undefined ? { pageId: entry.pageId } : {}),
    ...(entry.pluginId !== undefined ? { pluginId: entry.pluginId } : {}),
    ...(entry.actionConfiguration !== undefined
      ? { actionConfiguration: entry.actionConfiguration }
      : {}),
    ...(typeof entry.datasource?.id === "string"
      ? { datasource: { id: entry.datasource.id } }
      : {}),
  };
}

// The fixed JS plugin id (agents never supply it). Resolved from the plugins list by type/packageName.
function jsPluginId(plugins: unknown): string | undefined {
  if (!Array.isArray(plugins)) return undefined;

  const js = plugins.find(
    (plugin) =>
      plugin !== null &&
      typeof plugin === "object" &&
      ((plugin as { type?: unknown }).type === "JS" ||
        (plugin as { packageName?: unknown }).packageName === "js-plugin"),
  );
  const id = (js as { id?: unknown } | undefined)?.id;

  return typeof id === "string" ? id : undefined;
}

// Safe JS-object projection: id, name, page, and the declared function names. Never returns the compiled JS body.
function projectJsObject(collection: unknown): Record<string, unknown> {
  const entry = collection as {
    id?: unknown;
    name?: unknown;
    pageId?: unknown;
    actions?: { name?: unknown }[];
  } | null;

  return {
    id: entry?.id,
    name: entry?.name,
    pageId: entry?.pageId,
    functions: Array.isArray(entry?.actions)
      ? entry.actions
          .map((action) => (action as { name?: unknown }).name)
          .filter((name): name is string => typeof name === "string")
      : [],
  };
}

function fingerprintJsObject(collection: unknown): string {
  return createHash("sha256")
    .update(
      canonicalStableSerialize({
        ...projectJsObject(collection),
        updatedAt: (collection as { updatedAt?: unknown } | null)?.updatedAt,
      }),
      "utf8",
    )
    .digest("hex");
}

function projectJsList(collections: unknown): Record<string, unknown>[] {
  return Array.isArray(collections) ? collections.map(projectJsObject) : [];
}

function fingerprintJsList(collections: unknown): string {
  return createHash("sha256")
    .update(canonicalStableSerialize(projectJsList(collections)), "utf8")
    .digest("hex");
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

function actionNames(list: unknown): string[] {
  if (!Array.isArray(list)) return [];

  return list.flatMap((entry) => {
    if (entry === null || typeof entry !== "object") return [];

    const action = entry as {
      name?: unknown;
      unpublishedAction?: { name?: unknown };
    };
    const name = action.name ?? action.unpublishedAction?.name;

    return typeof name === "string" ? [name] : [];
  });
}

function projectActions(list: unknown): unknown[] {
  if (!Array.isArray(list)) return [];

  return list.flatMap((entry) => {
    if (entry === null || typeof entry !== "object") return [];

    const action = entry as {
      id?: unknown;
      name?: unknown;
      pageId?: unknown;
      pluginType?: unknown;
      unpublishedAction?: {
        id?: unknown;
        name?: unknown;
        pageId?: unknown;
        pluginType?: unknown;
        datasource?: { id?: unknown; pluginId?: unknown };
      };
      datasource?: { id?: unknown; pluginId?: unknown };
    };
    const source = action.unpublishedAction ?? action;
    const datasource = source.datasource;

    return [
      {
        id: action.id ?? source.id,
        name: source.name,
        pageId: source.pageId,
        pluginType: source.pluginType,
        ...(datasource
          ? {
              datasource: {
                id: datasource.id,
                pluginId: datasource.pluginId,
              },
            }
          : {}),
      },
    ];
  });
}

async function lintLiveDsl(
  api: AppsmithApi,
  applicationId: string,
  dsl: WidgetNode,
  dataEnabled: boolean,
) {
  if (!dataEnabled) return lintDsl(dsl);

  // Query names are authoritative on the server. If this optional diagnostic read
  // fails after a successful write, preserve the write result and return the
  // structural diagnostics that are still available locally.
  try {
    return lintDsl(dsl, {
      knownDataNames: actionNames(await api.listActions(applicationId)),
    });
  } catch {
    return lintDsl(dsl);
  }
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

// Project the raw /workspaces/home list (List<Workspace>) to just { id, name } pairs — the two fields an agent needs
// to turn a workspace NAME into the workspaceId the build/data tools require, without leaking other org metadata.
function projectWorkspaces(raw: unknown): { id: string; name: string }[] {
  if (!Array.isArray(raw)) return [];

  const workspaces: { id: string; name: string }[] = [];

  for (const entry of raw) {
    if (entry === null || typeof entry !== "object") continue;

    const id = (entry as { id?: unknown }).id;
    const name = (entry as { name?: unknown }).name;

    if (typeof id === "string" && typeof name === "string") {
      workspaces.push({ id, name });
    }
  }

  return workspaces;
}

export function buildMcpServer(
  api: AppsmithApi,
  ctx: ServerContext = { dataEnabled: false, jsEnabled: false, actorId: "" },
) {
  const { actorId, dataEnabled, governance, jsEnabled } = ctx;
  const server = new McpServer(
    { name: "appsmith-mcp", version: "0.0.1" },
    { instructions: SERVER_INSTRUCTIONS },
  );

  // Shared commit path for layout mutations (edit_page / patch_widgets). When governance is active it wraps the
  // write in a distributed lock + mandatory revision check + audit record (returning a changeId) and maps
  // governance failures to stable error codes; otherwise it performs the plain, already-revision-checked write.
  async function commitLayout(params: {
    applicationId: string;
    pageId: string;
    layoutId: string;
    currentDsl: WidgetNode;
    currentRevision: string;
    revision: string | undefined;
    operation: string;
    newDsl: WidgetNode;
    extra: Record<string, unknown>;
  }): Promise<ToolResult> {
    const write = async () => {
      const layout = await api.updateLayout(
        params.applicationId,
        params.pageId,
        params.layoutId,
        params.newDsl,
      );
      const diagnostics = await lintLiveDsl(
        api,
        params.applicationId,
        params.newDsl,
        dataEnabled,
      );

      return { layout, diagnostics };
    };
    const revisionAfter = fingerprintDsl(params.newDsl);

    // Every layout edit on a git-connected app is saved UNCOMMITTED on the branch; warn (but proceed) so the agent
    // surfaces it to the user. Fetched once here so all layout-editing tools (edit_page/patch_widgets/wire_event)
    // inherit the warning without each re-implementing the check (M1-T3).
    const gitWarning = gitEditWarning(
      await fetchGitState(api, params.applicationId),
    );

    // A stale revision is rejected consistently in both paths. The revision is a content hash of the public DSL (not
    // a secret), so a plain comparison is fine and avoids length-mismatch throws.
    if (
      params.revision !== undefined &&
      params.revision !== params.currentRevision
    ) {
      return result({
        error:
          "page revision is stale; re-read the page before retrying this mutation",
        code: "revision_conflict",
        revision: params.currentRevision,
      });
    }

    if (!governance) {
      const { diagnostics, layout } = await write();

      return result({
        ...params.extra,
        ...(gitWarning ? { gitWarning } : {}),
        diagnostics,
        layout,
        revision: revisionAfter,
      });
    }

    // Governance active -> a revision is mandatory (B): a blind write cannot be reconciled or rolled back.
    if (params.revision === undefined) {
      return result({
        error:
          "a page revision is required when governance is enabled; read the page first",
        code: "revision_required",
      });
    }

    try {
      const { changeId, value } = await governance.execute({
        actorId,
        entityKey: pageEntityKey(params.applicationId, params.pageId),
        operation: params.operation,
        expectedRevision: params.revision,
        currentRevision: params.currentRevision,
        mutate: async () => ({
          value: await write(),
          revisionAfter,
          // A layout snapshot the rollback tools can re-apply. Never returned to the agent.
          rollback: {
            kind: "layout",
            applicationId: params.applicationId,
            pageId: params.pageId,
            layoutId: params.layoutId,
            dsl: params.currentDsl,
          },
          summary: params.extra,
        }),
      });

      return result({
        ...params.extra,
        ...(gitWarning ? { gitWarning } : {}),
        diagnostics: value.diagnostics,
        layout: value.layout,
        revision: revisionAfter,
        changeId,
      });
    } catch (error) {
      return governanceError(error) ?? compileError(error);
    }
  }

  server.tool(
    "list_workspaces",
    "List workspaces accessible to the authenticated Appsmith user, as { id, name } pairs. Tools take a workspaceId, not a name — use this (or resolve_workspace) to turn a workspace NAME the user gives you into its id rather than asking the user for a raw id.",
    {},
    async () =>
      result({ workspaces: projectWorkspaces(await api.listWorkspaces()) }),
  );

  server.tool(
    "resolve_workspace",
    "Resolve a workspace NAME to its workspaceId. Returns matching { id, name } workspaces (an exact case-insensitive name match if one exists, otherwise partial matches). Use the returned id as the workspaceId for build_application and other workspace-scoped tools. If there are zero or multiple matches, show the user the candidates instead of guessing.",
    { name: z.string().trim().min(1).max(200) },
    async ({ name }) => {
      const workspaces = projectWorkspaces(await api.listWorkspaces());
      const query = name.trim().toLowerCase();
      const exact = workspaces.filter(
        (workspace) => workspace.name.toLowerCase() === query,
      );
      const matches =
        exact.length > 0
          ? exact
          : workspaces.filter((workspace) =>
              workspace.name.toLowerCase().includes(query),
            );

      return result({ query: name, matches });
    },
  );

  server.tool(
    "list_applications",
    "List applications in a workspace accessible to the authenticated Appsmith user. Pass a workspaceId (resolve a workspace name to its id with resolve_workspace / list_workspaces first).",
    { workspaceId: idSchema },
    async ({ workspaceId }) => result(await api.listApplications(workspaceId)),
  );

  server.tool(
    "get_application_context",
    "Read the requested application page and layout, plus the app's git-connection state. Appsmith authorizes every API request using the caller's bearer token.",
    { applicationId: idSchema, pageId: idSchema, layoutId: idSchema },
    async ({ applicationId, layoutId, pageId }) => {
      const [context, git] = await Promise.all([
        api.getApplicationContext(applicationId, pageId, layoutId),
        fetchGitState(api, applicationId),
      ]);

      // Surface git state so an agent knows up front that edits will be uncommitted and publish is disabled here.
      return result({ ...(context as Record<string, unknown>), git });
    },
  );

  // Note surfaced by get_capabilities so an agent learns the git policy before it starts editing.
  const GIT_POLICY_NOTE =
    "Git-connected applications: MCP edits are saved as UNCOMMITTED changes on the checked-out branch (commit them via Appsmith's git UI), and publishing from MCP is disabled for them. get_application_context reports each app's git-connection state.";

  // The raw artifact-import tools were removed: they let an agent upload an arbitrary artifact (custom JS libs, JS
  // objects, datasources) — a large content-injection surface. Authoring goes through the validated
  // build_application / edit_page spec compiler instead.

  server.tool(
    "get_capabilities",
    "Discover what this MCP server supports: widget types, spec shapes, presets, the layout grid, and the exact set of tools available under the current gates (data layer, restricted JS, governance). Call this first.",
    {},
    async () =>
      result({
        ...getCapabilities({
          data: dataEnabled,
          js: jsEnabled,
          governance: governance !== undefined,
        }),
        gitPolicy: GIT_POLICY_NOTE,
      }),
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
    "Create an Appsmith application from a high-level app spec. Widgets are auto-placed on the grid, compiled to an artifact, and imported via the caller's ACL-enforced permissions. workspaceId is required — if the user names a workspace, resolve it to its id with resolve_workspace (or list_workspaces) rather than asking for a raw id.",
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
    "Append widgets to an existing page from a high-level edit spec. Read the page with read_semantic_page first and pass its revision token to detect stale writes. Existing widgets are never modified.",
    {
      applicationId: idSchema,
      pageId: idSchema,
      layoutId: idSchema,
      revision: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
      edit: z.record(z.unknown()),
    },
    async ({ applicationId, edit, layoutId, pageId, revision }) => {
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

      const currentRevision = fingerprintDsl(currentDsl);

      let dsl: WidgetNode;
      let notes: string[];

      try {
        ({ dsl, notes } = applyEdit(currentDsl, parsed.data));
        // Guard the write path with the same size + plain-JSON check the import path uses.
        serializeArtifact(dsl as Record<string, unknown>);
      } catch (error) {
        return compileError(error);
      }

      return commitLayout({
        applicationId,
        pageId,
        layoutId,
        currentDsl,
        currentRevision,
        revision,
        operation: "edit_page",
        newDsl: dsl,
        extra: { notes },
      });
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

      return result({
        diagnostics: await lintLiveDsl(api, applicationId, dsl, dataEnabled),
      });
    },
  );

  server.tool(
    "patch_widgets",
    "Directly update, move, reparent, or remove widgets using a strict typed patch. Read the page with read_semantic_page first and pass its revision. Only allowlisted literal properties can change; removing a widget with children is rejected. Table styling: set literal 'oddRowColor'/'evenRowColor' for alternating (zebra) row backgrounds. Re-bind a table with structured 'tableData' { query, field?, clearWhenEmpty? } — clearWhenEmpty names an input whose emptiness clears the table (so a Clear button that resets that input also empties the table; resetWidget alone cannot clear a query-bound table). Input validation: set 'validation' { format: 'zipcode'|'email'|'number'|'integer'|'usPhone', message? } on an input to add a vetted regex + error message (never author a raw regex). Set 'disableWhenInvalid': '<input>' on a button to grey it out until that input passes validation (compiles to {{ !<input>.isValid }}) — use with validation so a bad value can't run the query. Conditional visibility / view switching: set 'visibleWhen' { control: '<select|tabs widget>', equals: '<value>' } to show a widget only when the control has that value — e.g. show a table when a ViewToggle equals 'Table' and a detail panel when it equals 'Details', switching views with one control.",
    {
      applicationId: idSchema,
      pageId: idSchema,
      layoutId: idSchema,
      revision: z.string().regex(/^[a-f0-9]{64}$/),
      patch: z.record(z.unknown()),
    },
    async ({ applicationId, layoutId, pageId, patch, revision }) => {
      const parsed = widgetPatchSchema.safeParse(patch);

      if (!parsed.success) return validationError(parsed.error.issues);

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

      const currentRevision = fingerprintDsl(currentDsl);

      let patched: ReturnType<typeof applyWidgetPatch>;

      try {
        patched = applyWidgetPatch(currentDsl, parsed.data);
        serializeArtifact(patched.dsl as Record<string, unknown>);
      } catch (error) {
        return compileError(error);
      }

      return commitLayout({
        applicationId,
        pageId,
        layoutId,
        currentDsl,
        currentRevision,
        revision,
        operation: "patch_widgets",
        newDsl: patched.dsl,
        extra: { changes: patched.changes },
      });
    },
  );

  server.tool(
    "wire_event",
    "Wire a widget event to a safe action from a CLOSED vocabulary: run a query, navigate to a page, show/close a modal, show an alert, or reset one or more widgets ({ reset: 'Widget' } or { reset: ['A','B'] } — e.g. a Clear button that empties an input and resets a table). A run action may chain onSuccess/onError follow-ups from the same vocabulary (e.g. submit -> run insert -> re-run the table's query -> close the modal -> alert). Supported events: button onClick, table onRowSelected, modal onClose, tabs onTabSelected. Read the page first and pass its revision. The compiler emits the binding; no raw JS or bindings are accepted.",
    {
      applicationId: idSchema,
      pageId: idSchema,
      layoutId: idSchema,
      revision: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
      spec: z.record(z.unknown()),
    },
    async ({ applicationId, layoutId, pageId, revision, spec }) => {
      const parsed = wireEventSpecSchema.safeParse(spec);

      if (!parsed.success) return validationError(parsed.error.issues);

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

      // Dangling-reference guard: every referenced query/page/widget — the primary action AND any onSuccess/onError
      // follow-ups — must exist before we write the trigger. Each backing list is fetched at most once.
      const references = eventReferences(parsed.data.action);

      for (const reference of references) {
        if (
          reference.kind === "widget" &&
          !widgetExists(currentDsl, reference.name)
        ) {
          return result({
            error: `modal/widget "${reference.name}" was not found on this page`,
          });
        }
      }

      const pageReferences = references.filter((ref) => ref.kind === "page");

      if (pageReferences.length > 0) {
        const pages = projectPages(
          await api.getApplicationPages(applicationId),
        );

        for (const reference of pageReferences) {
          if (!pages.some((page) => page.name === reference.name)) {
            return result({ error: `page "${reference.name}" was not found` });
          }
        }
      }

      const queryReferences = references.filter((ref) => ref.kind === "query");

      if (queryReferences.length > 0 && dataEnabled) {
        const known = actionNames(await api.listActions(applicationId));

        for (const reference of queryReferences) {
          if (!known.includes(reference.name)) {
            return result({
              error: `query "${reference.name}" was not found`,
            });
          }
        }
      }

      const currentRevision = fingerprintDsl(currentDsl);
      let newDsl: WidgetNode;

      try {
        ({ dsl: newDsl } = applyEvent(currentDsl, parsed.data));
        serializeArtifact(newDsl as Record<string, unknown>);
      } catch (error) {
        return compileError(error);
      }

      return commitLayout({
        applicationId,
        pageId,
        layoutId,
        currentDsl,
        currentRevision,
        revision,
        operation: "wire_event",
        newDsl,
        extra: { widget: parsed.data.widget, event: parsed.data.event },
      });
    },
  );

  server.tool(
    "read_semantic_page",
    "Read a compact, safe semantic view of a page for targeted authoring. Returns widget hierarchy, geometry, and allowlisted static properties, plus a revision token for a later write. It never returns arbitrary DSL properties, events, or raw bindings.",
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

      return result({
        revision: fingerprintDsl(dsl),
        page: projectSemanticPage(dsl),
        diagnostics: await lintLiveDsl(api, applicationId, dsl, dataEnabled),
      });
    },
  );

  server.tool(
    "read_pages",
    "List an application's pages (safe metadata: id, name, slug, visibility) plus a revision token for create_page / rename_page / delete_page. Never returns DSL, actions, or bindings.",
    { applicationId: idSchema },
    async ({ applicationId }) => {
      const pages = await api.getApplicationPages(applicationId);

      return result({
        pages: projectPages(pages),
        revision: fingerprintPages(pages),
      });
    },
  );

  server.tool(
    "read_publish_status",
    "Read the application's publish state (last deployed time, public flag, name) plus the current page-list revision to pass to prepare_publish.",
    { applicationId: idSchema },
    async ({ applicationId }) => {
      const pages = await api.getApplicationPages(applicationId);
      const application =
        (pages as { application?: Record<string, unknown> } | null)
          ?.application ?? {};

      return result({
        publish: {
          name: application.name,
          lastDeployedAt: application.lastDeployedAt,
          isPublic: application.isPublic,
        },
        revision: fingerprintPages(pages),
      });
    },
  );

  server.tool(
    "read_theme",
    "Read the application's safe theme tokens (primaryColor, borderRadius, fontFamily) plus a revision token for a later update_theme. Stylesheet and config internals are never returned.",
    { applicationId: idSchema },
    async ({ applicationId }) => {
      try {
        return result({
          theme: projectTheme(await api.getCurrentTheme(applicationId)),
        });
      } catch (error) {
        return compileError(error);
      }
    },
  );

  // Governed mutation tools require the Mongo+Redis governance coordinator (lock + revision + audit). When it is not
  // configured they are not registered at all, so a caller cannot perform a governed change without governance.
  if (governance) {
    const gov = governance;

    server.tool(
      "update_theme",
      "Update the application's theme tokens (primaryColor, borderRadius, fontFamily only) using a revision from read_theme. Stylesheets, CSS, URLs, and bindings are never accepted. Returns the new tokens, revision, and change id.",
      {
        applicationId: idSchema,
        revision: z.string().regex(/^[a-f0-9]{64}$/),
        patch: z.record(z.unknown()),
      },
      async ({ applicationId, patch, revision }) => {
        const parsed = themePatchSchema.safeParse(patch);

        if (!parsed.success) return validationError(parsed.error.issues);

        let currentTheme: unknown;
        let current: ReturnType<typeof projectTheme>;

        try {
          currentTheme = await api.getCurrentTheme(applicationId);
          current = projectTheme(currentTheme);
        } catch (error) {
          return compileError(error);
        }

        try {
          const { changeId, value } = await gov.execute({
            actorId,
            entityKey: `theme:${applicationId}`,
            operation: "update_theme",
            expectedRevision: revision,
            currentRevision: current.revision,
            mutate: async () => {
              const body = buildThemeUpdatePayload(currentTheme, parsed.data);
              const projection = projectTheme(
                await api.updateTheme(applicationId, body),
              );

              return {
                value: projection,
                revisionAfter: projection.revision,
                rollback: { tokens: current },
                summary: { tokens: parsed.data },
              };
            },
          });

          return result({ theme: value, revision: value.revision, changeId });
        } catch (error) {
          return governanceError(error) ?? compileError(error);
        }
      },
    );

    // Item I — audit history + bounded rollback over the MCP-owned change records.
    server.tool(
      "list_changes",
      "List recent MCP governance change records for the authenticated user (audit trail). Returns safe change headers and semantic summaries — never rollback snapshots.",
      { limit: z.number().int().min(1).max(100).optional() },
      async ({ limit }) =>
        result({
          changes: (await gov.listChanges(actorId, limit ?? 20)).map(
            projectChange,
          ),
        }),
    );

    server.tool(
      "get_change",
      "Get a single MCP change record by id (audit metadata + semantic summary; the rollback snapshot is never exposed).",
      { changeId: idSchema },
      async ({ changeId }) => {
        const change = await gov.getChange(changeId, actorId);

        return change
          ? result({ change: projectChange(change) })
          : result({ error: "change not found" });
      },
    );

    server.tool(
      "get_change_diff",
      "Get the semantic before/after summary for a change (operation, revisions, summary).",
      { changeId: idSchema },
      async ({ changeId }) => {
        const change = await gov.getChange(changeId, actorId);

        return change
          ? result({
              operation: change.operation,
              revisionBefore: change.revisionBefore,
              revisionAfter: change.revisionAfter,
              summary: change.summary,
            })
          : result({ error: "change not found" });
      },
    );

    server.tool(
      "prepare_rollback",
      "Prepare to roll back a layout change (edit_page/patch_widgets). Returns a one-time confirmation token. Only offered when a safe layout snapshot exists.",
      { changeId: idSchema },
      async ({ changeId }) => {
        const change = await gov.getChange(changeId, actorId);

        if (!change) return result({ error: "change not found" });

        if (!isLayoutRollbackable(change)) {
          return result({
            error: "this change cannot be safely rolled back",
            code: "rollback_unavailable",
          });
        }

        const confirmation = await gov.prepareDestructiveConfirmation({
          actorId,
          entityKey: change.entityKey,
          operation: "rollback",
          revision: change.revisionAfter,
          digest: operationDigest({ changeId }),
        });

        return result({
          confirmationId: confirmation.id,
          expiresAt: confirmation.expiresAt,
          changeId,
        });
      },
    );

    server.tool(
      "confirm_rollback",
      "Roll back a layout change using a confirmation token from prepare_rollback. Re-applies the prior layout snapshot only if the page is unchanged since the change.",
      { changeId: idSchema, confirmationId: idSchema },
      async ({ changeId, confirmationId }) => {
        const change = await gov.getChange(changeId, actorId);

        if (!change) return result({ error: "change not found" });

        const rollback = change.rollback as {
          kind?: string;
          applicationId?: string;
          pageId?: string;
          layoutId?: string;
          dsl?: WidgetNode;
        };

        if (
          rollback?.kind !== "layout" ||
          !rollback.applicationId ||
          !rollback.pageId ||
          !rollback.layoutId ||
          !rollback.dsl
        ) {
          return result({
            error: "this change cannot be safely rolled back",
            code: "rollback_unavailable",
          });
        }

        try {
          await gov.consumeDestructiveConfirmation({
            confirmationId,
            actorId,
            entityKey: change.entityKey,
            operation: "rollback",
            revision: change.revisionAfter,
            digest: operationDigest({ changeId }),
          });

          const context = await api.getApplicationContext(
            rollback.applicationId,
            rollback.pageId,
            rollback.layoutId,
          );
          const currentDsl = (
            context.layout as { dsl?: WidgetNode } | undefined
          )?.dsl;

          if (!currentDsl) {
            return result({ error: "could not read the current page layout" });
          }

          const snapshot = rollback.dsl;
          const { changeId: newChangeId } = await gov.execute({
            actorId,
            entityKey: change.entityKey,
            operation: "rollback",
            // The page must be unchanged since the change being rolled back.
            expectedRevision: change.revisionAfter,
            currentRevision: fingerprintDsl(currentDsl),
            mutate: async () => {
              const layout = await api.updateLayout(
                rollback.applicationId!,
                rollback.pageId!,
                rollback.layoutId!,
                snapshot,
              );

              return {
                value: { layout },
                revisionAfter: fingerprintDsl(snapshot),
                rollback: {
                  kind: "layout",
                  applicationId: rollback.applicationId,
                  pageId: rollback.pageId,
                  layoutId: rollback.layoutId,
                  dsl: currentDsl,
                },
                summary: { rolledBackChange: changeId },
              };
            },
          });

          return result({
            rolledBack: true,
            revision: fingerprintDsl(snapshot),
            changeId: newChangeId,
          });
        } catch (error) {
          return governanceError(error) ?? compileError(error);
        }
      },
    );

    // Item H — publish is high-impact, so it is confirmation-gated.
    server.tool(
      "prepare_publish",
      "Publishing (deploying) the application is high-impact. Returns a one-time confirmation token bound to the application and its current page-list revision. Call confirm_publish with the token to deploy.",
      {
        applicationId: idSchema,
        revision: z.string().regex(/^[a-f0-9]{64}$/),
      },
      async ({ applicationId, revision }) => {
        const confirmation = await gov.prepareDestructiveConfirmation({
          actorId,
          entityKey: `application:${applicationId}`,
          operation: "publish",
          revision,
          digest: operationDigest({ applicationId }),
        });

        return result({
          confirmationId: confirmation.id,
          expiresAt: confirmation.expiresAt,
          operation: "publish",
        });
      },
    );

    server.tool(
      "confirm_publish",
      "Publish (deploy) the application using a confirmation token from prepare_publish. Token, actor, application, and revision must match, and the page-list revision must be unchanged since preparation.",
      {
        applicationId: idSchema,
        revision: z.string().regex(/^[a-f0-9]{64}$/),
        confirmationId: idSchema,
      },
      async ({ applicationId, confirmationId, revision }) => {
        try {
          // Refuse to deploy a git-connected app: publishing from MCP would ship whatever uncommitted state sits on the
          // branch, bypassing the git review/commit flow. Checked before consuming the confirmation so the token is not
          // spent on a refused publish. This is a HARD gate, so — unlike the advisory edit warning (fetchGitState,
          // fail-open) — it fails CLOSED: if the git state cannot be read, refuse rather than risk deploying
          // uncommitted git state.
          let git: GitState;

          try {
            git = gitStateOf(await api.getApplication(applicationId));
          } catch {
            return result({
              error:
                "Could not verify the application's git-connection state; refusing to publish. Retry, or deploy through Appsmith's git flow.",
              code: "git_state_unknown",
              published: false,
            });
          }

          if (git.connected) {
            const branch = git.branchName
              ? ` (branch "${git.branchName}")`
              : "";

            return result({
              error: `This application is connected to git${branch}. Publishing from MCP is disabled — commit your changes and deploy through Appsmith's git flow instead.`,
              code: "git_connected",
              published: false,
            });
          }

          await gov.consumeDestructiveConfirmation({
            confirmationId,
            actorId,
            entityKey: `application:${applicationId}`,
            operation: "publish",
            revision,
            digest: operationDigest({ applicationId }),
          });

          const currentRevision = fingerprintPages(
            await api.getApplicationPages(applicationId),
          );
          const { changeId } = await gov.execute({
            actorId,
            entityKey: `application:${applicationId}`,
            operation: "publish",
            expectedRevision: revision,
            currentRevision,
            mutate: async () => {
              await api.publishApplication(applicationId);

              return {
                value: {},
                revisionAfter: currentRevision,
                rollback: {},
                summary: { applicationId },
              };
            },
          });

          return result({ published: true, changeId });
        } catch (error) {
          return governanceError(error) ?? compileError(error);
        }
      },
    );

    server.tool(
      "create_page",
      "Create a new blank page in an application. The caller cannot supply DSL, actions, or bindings — only a safe page name. Pass a page-list revision from the application's pages for optimistic concurrency. Returns the safe page list, new revision, and change id.",
      { spec: z.record(z.unknown()) },
      async ({ spec }) => {
        const parsed = createPageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        const request = buildCreatePageRequest(parsed.data);
        const currentRevision = fingerprintPages(
          await api.getApplicationPages(parsed.data.applicationId),
        );

        try {
          const { changeId, value } = await gov.execute({
            actorId,
            entityKey: pagesEntityKey(parsed.data.applicationId),
            operation: "create_page",
            expectedRevision: parsed.data.revision,
            currentRevision,
            mutate: async () => {
              const created = await api.createPage(request.body);
              const after = await api.getApplicationPages(
                parsed.data.applicationId,
              );

              return {
                value: {
                  pageId: (created as { id?: string } | null)?.id,
                  pages: projectPages(after),
                },
                revisionAfter: fingerprintPages(after),
                rollback: {
                  createdPageId: (created as { id?: string } | null)?.id,
                },
                summary: { name: parsed.data.name },
              };
            },
          });

          return result({ created: true, ...value, changeId });
        } catch (error) {
          return governanceError(error) ?? compileError(error);
        }
      },
    );

    server.tool(
      "rename_page",
      "Rename a page. Pass the application's page-list revision for optimistic concurrency. Returns the safe page list, new revision, and change id.",
      { spec: z.record(z.unknown()) },
      async ({ spec }) => {
        const parsed = renamePageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        const request = buildRenamePageRequest(parsed.data);
        const currentRevision = fingerprintPages(
          await api.getApplicationPages(parsed.data.applicationId),
        );

        try {
          const { changeId, value } = await gov.execute({
            actorId,
            entityKey: pagesEntityKey(parsed.data.applicationId),
            operation: "rename_page",
            expectedRevision: parsed.data.revision,
            currentRevision,
            mutate: async () => {
              await api.updatePage(parsed.data.pageId, request.body);
              const after = await api.getApplicationPages(
                parsed.data.applicationId,
              );

              return {
                value: { pages: projectPages(after) },
                revisionAfter: fingerprintPages(after),
                rollback: { pageId: parsed.data.pageId },
                summary: { name: parsed.data.name },
              };
            },
          });

          return result({ renamed: true, ...value, changeId });
        } catch (error) {
          return governanceError(error) ?? compileError(error);
        }
      },
    );

    server.tool(
      "prepare_delete_page",
      "Prepare to delete a page. Deleting a page is destructive, so this returns a one-time confirmation token bound to this exact page and revision. Call confirm_delete_page with the token to perform the deletion.",
      { spec: z.record(z.unknown()) },
      async ({ spec }) => {
        const parsed = deletePageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        const confirmation = await gov.prepareDestructiveConfirmation({
          actorId,
          entityKey: pagesEntityKey(parsed.data.applicationId),
          operation: "delete_page",
          revision: parsed.data.revision,
          digest: operationDigest({
            applicationId: parsed.data.applicationId,
            pageId: parsed.data.pageId,
          }),
        });

        return result({
          confirmationId: confirmation.id,
          expiresAt: confirmation.expiresAt,
          operation: "delete_page",
          pageId: parsed.data.pageId,
        });
      },
    );

    server.tool(
      "confirm_delete_page",
      "Delete a page using a confirmation token from prepare_delete_page. The token, actor, page, and revision must all match, and the page-list revision must be unchanged since preparation.",
      {
        spec: z.record(z.unknown()),
        confirmationId: idSchema,
      },
      async ({ confirmationId, spec }) => {
        const parsed = deletePageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        try {
          await gov.consumeDestructiveConfirmation({
            confirmationId,
            actorId,
            entityKey: pagesEntityKey(parsed.data.applicationId),
            operation: "delete_page",
            revision: parsed.data.revision,
            digest: operationDigest({
              applicationId: parsed.data.applicationId,
              pageId: parsed.data.pageId,
            }),
          });

          const currentRevision = fingerprintPages(
            await api.getApplicationPages(parsed.data.applicationId),
          );
          const { changeId, value } = await gov.execute({
            actorId,
            entityKey: pagesEntityKey(parsed.data.applicationId),
            operation: "delete_page",
            expectedRevision: parsed.data.revision,
            currentRevision,
            mutate: async () => {
              await api.deletePage(parsed.data.pageId);
              const after = await api.getApplicationPages(
                parsed.data.applicationId,
              );

              return {
                value: { pages: projectPages(after) },
                revisionAfter: fingerprintPages(after),
                rollback: { deletedPageId: parsed.data.pageId },
                summary: { pageId: parsed.data.pageId },
              };
            },
          });

          return result({ deleted: true, ...value, changeId });
        } catch (error) {
          return governanceError(error) ?? compileError(error);
        }
      },
    );
  }

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
      "create_datasource",
      "Create a datasource in a workspace. Supported: PostgreSQL/MySQL/Microsoft SQL Server databases (pass `connection` with non-secret host/port/database/username; the password is completed later in the Appsmith UI), and REST APIs (pass `url` with the base URL — created ready to use when the API needs no auth). Credentials are NEVER accepted or transmitted by this tool. Idempotent by workspace + name.",
      {
        workspaceId: idSchema,
        name: z
          .string()
          .trim()
          .min(1)
          .max(99)
          .regex(
            /^[A-Za-z0-9_ -]+$/,
            "name must be alphanumeric/underscore/space/dash",
          ),
        plugin: z.enum(["postgresql", "mysql", "mssql", "rest"]),
        // Database datasources only.
        connection: z
          .object({
            host: z
              .string()
              .trim()
              .min(1)
              .max(255)
              .regex(
                /^[A-Za-z0-9_.-]+$/,
                "host must be a hostname or IP address",
              ),
            port: z.number().int().min(1).max(65535).optional(),
            databaseName: z
              .string()
              .trim()
              .min(1)
              .max(128)
              .regex(/^[A-Za-z0-9_-]+$/, "databaseName has unsafe characters"),
            username: z
              .string()
              .trim()
              .min(1)
              .max(128)
              .regex(/^[A-Za-z0-9_.@-]+$/, "username has unsafe characters")
              .optional(),
          })
          .strict()
          .optional(),
        // REST datasources only: the API base URL.
        url: restBaseUrlSchema.optional(),
      },
      async ({ connection, name, plugin, url, workspaceId }) => {
        const isRest = plugin === "rest";

        // Enforce the input shape per plugin family: databases take `connection`, REST takes `url`. Reject a
        // foreign field first (clearer feedback) before flagging a missing required one.
        if (isRest) {
          if (connection !== undefined) {
            return result({
              error:
                "'connection' is only for database datasources; REST uses 'url'",
            });
          }

          if (url === undefined) {
            return result({
              error: "a REST datasource requires 'url' (its base URL)",
            });
          }
        } else {
          if (url !== undefined) {
            return result({
              error:
                "'url' is only for REST datasources; databases use 'connection'",
            });
          }

          if (connection === undefined) {
            return result({
              error: `a ${plugin} datasource requires 'connection' details (host, databaseName, ...)`,
            });
          }
        }

        const packageName = isRest
          ? REST_DATASOURCE_PACKAGE_NAME
          : CREATABLE_DATASOURCE_PLUGINS[plugin].packageName;

        // Resolve the plugin DOCUMENT id from its stable packageName — plugin ids are per-instance.
        const plugins = await api.listPlugins(workspaceId);
        const pluginId = pluginIdByPackageName(plugins, packageName);

        if (pluginId === undefined) {
          return result({
            error: `the ${plugin} plugin is not installed on this instance`,
          });
        }

        // REST datasources with only a base URL and no auth are complete and immediately usable; database
        // datasources are created unconfigured and await a password in the UI.
        const nextStep = isRest
          ? {
              needsCredentials: false as const,
              nextStep: `The REST datasource "${name}" is ready to use. Author actions against it with create_rest_api.`,
            }
          : datasourceNextStep(name);

        // Idempotency: a datasource with this name in this workspace is returned, not duplicated.
        const existing = findDatasourceNamed(
          await api.listDatasources(workspaceId),
          name,
        );

        if (existing !== undefined) {
          return result({
            created: false,
            reason:
              "a datasource with this name already exists in this workspace",
            datasource: projectDatasources(existing),
            ...nextStep,
          });
        }

        // REST base URL is not a secret, so a no-auth REST datasource is created CONFIGURED. Database datasources
        // are created UNCONFIGURED (no credentials) — the same state as importing an app without configuring them.
        // CE keys every storage under the fixed "unused_env" environment.
        const datasourceConfiguration = isRest
          ? {
              url,
              headers: [],
              queryParameters: [],
              isSendSessionEnabled: false,
            }
          : {
              connection: {
                mode: "READ_WRITE",
                ssl: { authType: "DEFAULT" },
              },
              endpoints: [
                {
                  host: connection!.host,
                  port:
                    connection!.port ??
                    CREATABLE_DATASOURCE_PLUGINS[plugin].defaultPort,
                },
              ],
              authentication: {
                authenticationType: "dbAuth",
                databaseName: connection!.databaseName,
                ...(connection!.username !== undefined
                  ? { username: connection!.username }
                  : {}),
              },
            };

        const created = await api.createDatasource({
          name,
          workspaceId,
          pluginId,
          datasourceStorages: {
            [DEFAULT_ENVIRONMENT_ID]: {
              environmentId: DEFAULT_ENVIRONMENT_ID,
              isConfigured: isRest,
              datasourceConfiguration,
            },
          },
        });

        return result({
          created: true,
          datasource: projectDatasources(created),
          ...nextStep,
        });
      },
    );

    server.tool(
      "get_datasource_structure",
      "Read a datasource's structure (tables/columns) so you can shape queries and bindings. Read-only.",
      { datasourceId: idSchema },
      async ({ datasourceId }) =>
        result(await api.getDatasourceStructure(datasourceId)),
    );

    server.tool(
      "list_actions",
      "List safe metadata for the authenticated user's actions in an application. Query bodies, headers, credentials, and raw action configuration are intentionally excluded.",
      { applicationId: idSchema },
      async ({ applicationId }) =>
        result(projectActions(await api.listActions(applicationId))),
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
        const workspaceId = workspaceIdFromApplicationPages(
          await api.getApplicationPages(spec.applicationId),
        );

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

        const plugins = await api.listPlugins(workspaceId);

        if (!isSqlDatasource(datasources, plugins, spec.datasourceId)) {
          return result({
            error:
              "create_query currently supports only MariaDB, Microsoft SQL Server, MySQL, Oracle, PostgreSQL, and Snowflake datasources",
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

    server.tool(
      "create_rest_api",
      "Create a REST API action from a structured specification using an existing REST datasource. The datasource retains its server-side base URL and credentials. Supports safe path segments, dynamic path segments from widgets (pathParams, e.g. path '/us' + a zip from an input -> /us/{value}), query parameters, fixed headers, literals, and validated widget-property bindings. Idempotent by page + name.",
      { api: z.record(z.unknown()) },
      async ({ api: restApi }) => {
        const parsed = restApiSpecSchema.safeParse(restApi);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;
        const workspaceId = workspaceIdFromApplicationPages(
          await api.getApplicationPages(spec.applicationId),
        );

        if (typeof workspaceId !== "string") {
          return result({
            error: `could not resolve the workspace for application ${spec.applicationId}`,
          });
        }

        const datasources = await api.listDatasources(workspaceId);

        if (!datasourceAccessible(datasources, spec.datasourceId)) {
          return result({
            error: `datasource ${spec.datasourceId} is not accessible in this application's workspace`,
          });
        }

        const plugins = await api.listPlugins(workspaceId);

        if (!isRestDatasource(datasources, plugins, spec.datasourceId)) {
          return result({
            error: "create_rest_api requires an existing REST API datasource",
          });
        }

        const existing = findExistingAction(
          await api.listActions(spec.applicationId),
          spec.name,
          spec.pageId,
        );

        if (existing !== undefined) {
          return result({
            created: false,
            reason: "an action with this name already exists on this page",
            action: existing,
          });
        }

        try {
          const compiled = compileRestApi(spec);
          const created = await api.createAction(
            buildRestActionDto(spec, compiled),
          );

          return result({
            created: true,
            action: created,
            request: {
              method: spec.method,
              path: compiled.path,
              queryParameterCount: compiled.queryParameters.length,
            },
          });
        } catch (error) {
          return compileError(error);
        }
      },
    );

    server.tool(
      "get_action",
      "Read safe metadata for a single action (id, name, page, plugin, datasource) plus a revision token for update/duplicate/delete. Never returns the query body, headers, or credentials.",
      { applicationId: idSchema, actionId: idSchema },
      async ({ actionId, applicationId }) => {
        const action = await api.getAction(applicationId, actionId);

        return result({
          action: projectAction(action),
          revision: fingerprintAction(action),
        });
      },
    );

    server.tool(
      "run_action",
      "Run a stored action by id WITHOUT a confirmation step — allowed only for an action that is both protocol-level read-only AND pinned to a server-side host-restricted datasource. REST/external actions (which can egress to any host) and DB/SQL queries (whose text cannot be proven read-only) are refused here; use prepare_run_action / confirm_run_action for those. No execute payload is accepted.",
      { applicationId: idSchema, actionId: idSchema },
      async ({ actionId, applicationId }) => {
        const action = await api.getAction(applicationId, actionId);

        if (!isReadOnlyAction(action)) {
          return result({
            error:
              "this action cannot be auto-run (external egress or non-provably-read-only); use prepare_run_action then confirm_run_action",
            code: "confirmation_required",
            readOnly: false,
          });
        }

        return result({
          executed: true,
          readOnly: true,
          result: await api.executeAction(actionId),
        });
      },
    );

    // Action mutations additionally require governance (lock + revision + audit / confirmation).
    if (governance) {
      const govData = governance;

      server.tool(
        "update_action",
        "Update a stored SQL or REST action from a STRUCTURED spec (no raw SQL, bindings, credentials, base URLs, or headers). Pass a revision from get_action. Returns safe metadata, new revision, and change id.",
        { spec: z.record(z.unknown()) },
        async ({ spec }) => {
          const parsed = updateActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const request = buildUpdateActionDto(parsed.data);
          let current: unknown;

          try {
            current = await api.getAction(
              request.applicationId,
              request.actionId,
            );
          } catch (error) {
            return compileError(error);
          }

          try {
            const { changeId, value } = await govData.execute({
              actorId,
              entityKey: `action:${request.actionId}`,
              operation: "update_action",
              expectedRevision: parsed.data.revision,
              currentRevision: fingerprintAction(current),
              mutate: async () => {
                const updated = await api.updateAction(
                  request.actionId,
                  request.action,
                );

                return {
                  value: {
                    action: projectAction(updated),
                    revision: fingerprintAction(updated),
                  },
                  revisionAfter: fingerprintAction(updated),
                  rollback: { actionId: request.actionId },
                  summary: { actionId: request.actionId },
                };
              },
            });

            return result({ updated: true, ...value, changeId });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );

      server.tool(
        "duplicate_action",
        "Duplicate a stored action under a new name, preserving its datasource server-side. No action configuration is accepted from the caller. Pass a revision from get_action. Governed.",
        { spec: z.record(z.unknown()) },
        async ({ spec }) => {
          const parsed = duplicateActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const request = buildDuplicateActionDto(parsed.data);
          let current: unknown;

          try {
            current = await api.getAction(
              request.applicationId,
              request.actionId,
            );
          } catch (error) {
            return compileError(error);
          }

          try {
            const { changeId, value } = await govData.execute({
              actorId,
              entityKey: `action:${request.actionId}`,
              operation: "duplicate_action",
              expectedRevision: parsed.data.revision,
              currentRevision: fingerprintAction(current),
              mutate: async () => {
                const created = await api.createAction(
                  cloneActionForDuplicate(current, request.name),
                );

                return {
                  value: {
                    action: projectAction(created),
                    revision: fingerprintAction(created),
                  },
                  revisionAfter: fingerprintAction(created),
                  rollback: {
                    createdActionId: (created as { id?: string } | null)?.id,
                  },
                  summary: { name: request.name },
                };
              },
            });

            return result({ duplicated: true, ...value, changeId });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );

      server.tool(
        "prepare_delete_action",
        "Prepare to delete an action. Returns a one-time confirmation token bound to this exact action and revision. Call confirm_delete_action with the token to delete it.",
        { spec: z.record(z.unknown()) },
        async ({ spec }) => {
          const parsed = deleteActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const confirmation = await govData.prepareDestructiveConfirmation({
            actorId,
            entityKey: `action:${parsed.data.actionId}`,
            operation: "delete_action",
            revision: parsed.data.revision,
            digest: operationDigest({
              applicationId: parsed.data.applicationId,
              actionId: parsed.data.actionId,
            }),
          });

          return result({
            confirmationId: confirmation.id,
            expiresAt: confirmation.expiresAt,
            operation: "delete_action",
            actionId: parsed.data.actionId,
          });
        },
      );

      server.tool(
        "confirm_delete_action",
        "Delete an action using a confirmation token from prepare_delete_action. Token, actor, action, and revision must all match, and the action's revision must be unchanged since preparation.",
        { spec: z.record(z.unknown()), confirmationId: idSchema },
        async ({ confirmationId, spec }) => {
          const parsed = deleteActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          try {
            await govData.consumeDestructiveConfirmation({
              confirmationId,
              actorId,
              entityKey: `action:${parsed.data.actionId}`,
              operation: "delete_action",
              revision: parsed.data.revision,
              digest: operationDigest({
                applicationId: parsed.data.applicationId,
                actionId: parsed.data.actionId,
              }),
            });

            const current = await api.getAction(
              parsed.data.applicationId,
              parsed.data.actionId,
            );
            const { changeId } = await govData.execute({
              actorId,
              entityKey: `action:${parsed.data.actionId}`,
              operation: "delete_action",
              expectedRevision: parsed.data.revision,
              currentRevision: fingerprintAction(current),
              mutate: async () => {
                await api.deleteAction(parsed.data.actionId);

                return {
                  value: {},
                  revisionAfter: "deleted",
                  rollback: { deletedActionId: parsed.data.actionId },
                  summary: { actionId: parsed.data.actionId },
                };
              },
            });

            return result({
              deleted: true,
              actionId: parsed.data.actionId,
              changeId,
            });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );

      server.tool(
        "prepare_run_action",
        "Prepare to run an action. Non-read-only executions require this confirmation step. Returns a one-time token bound to this action and revision, plus whether the action is read-only. Pass a revision from get_action.",
        {
          applicationId: idSchema,
          actionId: idSchema,
          revision: z.string().regex(/^[a-f0-9]{64}$/),
        },
        async ({ actionId, applicationId, revision }) => {
          const action = await api.getAction(applicationId, actionId);
          const confirmation = await govData.prepareDestructiveConfirmation({
            actorId,
            entityKey: `action:${actionId}`,
            operation: "run_action",
            revision,
            digest: operationDigest({ actionId }),
          });

          return result({
            confirmationId: confirmation.id,
            expiresAt: confirmation.expiresAt,
            operation: "run_action",
            readOnly: isReadOnlyAction(action),
          });
        },
      );

      server.tool(
        "confirm_run_action",
        "Run an action using a confirmation token from prepare_run_action. Token, actor, action, and revision must match, and the action must be unchanged since preparation. Returns the execution result and an audit change id.",
        {
          applicationId: idSchema,
          actionId: idSchema,
          revision: z.string().regex(/^[a-f0-9]{64}$/),
          confirmationId: idSchema,
        },
        async ({ actionId, applicationId, confirmationId, revision }) => {
          try {
            await govData.consumeDestructiveConfirmation({
              confirmationId,
              actorId,
              entityKey: `action:${actionId}`,
              operation: "run_action",
              revision,
              digest: operationDigest({ actionId }),
            });

            const current = await api.getAction(applicationId, actionId);
            const { changeId, value } = await govData.execute({
              actorId,
              entityKey: `action:${actionId}`,
              operation: "run_action",
              expectedRevision: revision,
              currentRevision: fingerprintAction(current),
              mutate: async () => ({
                value: { result: await api.executeAction(actionId) },
                revisionAfter: fingerprintAction(current),
                rollback: {},
                summary: { actionId },
              }),
            });

            return result({ executed: true, ...value, changeId });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );
    }
  }

  // Item G — restricted JS objects, gated behind APPSMITH_MCP_JS_ENABLED. The agent supplies only a declarative,
  // restricted definition (constants + async functions that run named queries and return literal objects); the
  // jsObject compiler emits the JS. Raw JS source is never accepted.
  if (jsEnabled) {
    server.tool(
      "read_js_object",
      "List the application's JS objects with safe metadata (id, name, page, function names) and revision tokens for update/delete, plus a list revision for create. Never returns JS source.",
      { applicationId: idSchema },
      async ({ applicationId }) => {
        const collections = await api.listActionCollections(applicationId);

        return result({
          jsObjects: (Array.isArray(collections) ? collections : []).map(
            (collection) => ({
              ...projectJsObject(collection),
              revision: fingerprintJsObject(collection),
            }),
          ),
          revision: fingerprintJsList(collections),
        });
      },
    );

    if (governance) {
      const govJs = governance;

      server.tool(
        "create_js_object",
        "Create a restricted JS object from a declarative spec (constants + async functions that run named queries and return literal objects). No raw JS, imports, globals, network calls, or loops. Pass a JS-list revision from read_js_object. Governed.",
        { spec: z.record(z.unknown()) },
        async ({ spec }) => {
          const raw = spec as Record<string, unknown>;
          const applicationId = raw.applicationId;

          if (typeof applicationId !== "string") {
            return result({ error: "spec.applicationId is required" });
          }

          // Resolve workspace + JS plugin server-side; the agent never supplies these ids.
          const workspaceId = workspaceIdFromApplicationPages(
            await api.getApplicationPages(applicationId),
          );

          if (typeof workspaceId !== "string") {
            return result({
              error: "could not resolve the workspace or JS plugin",
            });
          }

          const pluginId = jsPluginId(await api.listPlugins(workspaceId));

          if (pluginId === undefined) {
            return result({
              error: "could not resolve the workspace or JS plugin",
            });
          }

          const parsed = createJsObjectSpecSchema.safeParse({
            ...raw,
            workspaceId,
            pluginId,
          });

          if (!parsed.success) return validationError(parsed.error.issues);

          const request = buildCreateJsObjectRequest(parsed.data);
          const currentRevision = fingerprintJsList(
            await api.listActionCollections(applicationId),
          );

          try {
            const { changeId, value } = await govJs.execute({
              actorId,
              entityKey: `application:${applicationId}:jsobjects`,
              operation: "create_js_object",
              expectedRevision: parsed.data.revision,
              currentRevision,
              mutate: async () => {
                const created = await api.createActionCollection(request.body);

                return {
                  value: { jsObject: projectJsObject(created) },
                  revisionAfter: fingerprintJsList(
                    await api.listActionCollections(applicationId),
                  ),
                  rollback: {
                    createdCollectionId: (created as { id?: string } | null)
                      ?.id,
                  },
                  summary: { name: parsed.data.name },
                };
              },
            });

            return result({ created: true, ...value, changeId });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );

      server.tool(
        "update_js_object",
        "Update a restricted JS object from a declarative spec. Pass a revision from read_js_object. No raw JS. Governed.",
        { spec: z.record(z.unknown()) },
        async ({ spec }) => {
          const parsed = updateJsObjectSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const collections = await api.listActionCollections(
            parsed.data.applicationId,
          );
          const current = (Array.isArray(collections) ? collections : []).find(
            (collection) =>
              (collection as { id?: unknown } | null)?.id ===
              parsed.data.collectionId,
          );

          if (current === undefined) {
            return result({ error: "js object not found" });
          }

          const request = buildUpdateJsObjectRequest(parsed.data);

          try {
            const { changeId, value } = await govJs.execute({
              actorId,
              entityKey: `jsobject:${parsed.data.collectionId}`,
              operation: "update_js_object",
              expectedRevision: parsed.data.revision,
              currentRevision: fingerprintJsObject(current),
              mutate: async () => {
                const updated = await api.updateActionCollection(
                  parsed.data.collectionId,
                  request.body,
                );

                return {
                  value: { jsObject: projectJsObject(updated) },
                  revisionAfter: fingerprintJsObject(updated),
                  rollback: { collectionId: parsed.data.collectionId },
                  summary: { collectionId: parsed.data.collectionId },
                };
              },
            });

            return result({ updated: true, ...value, changeId });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );

      server.tool(
        "prepare_delete_js_object",
        "Prepare to delete a JS object. Returns a one-time confirmation token bound to this object and revision.",
        { spec: z.record(z.unknown()) },
        async ({ spec }) => {
          const parsed = deleteJsObjectSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const confirmation = await govJs.prepareDestructiveConfirmation({
            actorId,
            entityKey: `jsobject:${parsed.data.collectionId}`,
            operation: "delete_js_object",
            revision: parsed.data.revision,
            digest: operationDigest({
              applicationId: parsed.data.applicationId,
              collectionId: parsed.data.collectionId,
            }),
          });

          return result({
            confirmationId: confirmation.id,
            expiresAt: confirmation.expiresAt,
            operation: "delete_js_object",
            collectionId: parsed.data.collectionId,
          });
        },
      );

      server.tool(
        "confirm_delete_js_object",
        "Delete a JS object using a confirmation token from prepare_delete_js_object. Token, actor, object, and revision must all match.",
        { spec: z.record(z.unknown()), confirmationId: idSchema },
        async ({ confirmationId, spec }) => {
          const parsed = deleteJsObjectSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          try {
            await govJs.consumeDestructiveConfirmation({
              confirmationId,
              actorId,
              entityKey: `jsobject:${parsed.data.collectionId}`,
              operation: "delete_js_object",
              revision: parsed.data.revision,
              digest: operationDigest({
                applicationId: parsed.data.applicationId,
                collectionId: parsed.data.collectionId,
              }),
            });

            const collections = await api.listActionCollections(
              parsed.data.applicationId,
            );
            const current = (
              Array.isArray(collections) ? collections : []
            ).find(
              (collection) =>
                (collection as { id?: unknown } | null)?.id ===
                parsed.data.collectionId,
            );
            const { changeId } = await govJs.execute({
              actorId,
              entityKey: `jsobject:${parsed.data.collectionId}`,
              operation: "delete_js_object",
              expectedRevision: parsed.data.revision,
              currentRevision: fingerprintJsObject(current),
              mutate: async () => {
                await api.deleteActionCollection(parsed.data.collectionId);

                return {
                  value: {},
                  revisionAfter: "deleted",
                  rollback: { deletedCollectionId: parsed.data.collectionId },
                  summary: { collectionId: parsed.data.collectionId },
                };
              },
            });

            return result({
              deleted: true,
              collectionId: parsed.data.collectionId,
              changeId,
            });
          } catch (error) {
            return governanceError(error) ?? compileError(error);
          }
        },
      );
    }
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

function logMcpEvent(event: string, fields: Record<string, unknown>) {
  // Keep audit records machine-readable and intentionally omit bearer tokens,
  // request bodies, and tool arguments because they can contain credentials or
  // customer data.
  process.stderr.write(
    `${JSON.stringify({ event, timestamp: new Date().toISOString(), ...fields })}\n`,
  );
}

function requestOperation(body: unknown): { method?: string; tool?: string } {
  if (!body || typeof body !== "object") return {};

  const request = body as {
    method?: unknown;
    params?: { name?: unknown };
  };
  const method =
    typeof request.method === "string" ? request.method : undefined;
  const tool =
    method === "tools/call" && typeof request.params?.name === "string"
      ? request.params.name
      : undefined;

  return { method, tool };
}

function correlationHeaders(req: IncomingMessage): Record<string, string> {
  const internalRequestId = req.headers["x-appsmith-request-id"];
  const requestId = req.headers["x-request-id"];
  const headers: Record<string, string> = {
    "X-Appsmith-Request-Id":
      typeof internalRequestId === "string" ? internalRequestId : randomUUID(),
  };

  if (typeof requestId === "string") {
    headers["X-Request-Id"] = requestId;
  }

  return headers;
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
  // Gate for restricted JS objects (APPSMITH_MCP_JS_ENABLED). Off by default.
  jsEnabled?: boolean;
  // Governance coordinator (present only when Mongo+Redis are configured). When absent, governed/destructive tools
  // are not registered and normal mutations run unlocked (still revision-checked).
  governance?: McpGovernanceCoordinator;
  // Optional Host-header allowlist (hostnames, port ignored) — a configured DNS-rebinding defense to complement the
  // unconditional Origin rejection. Empty/undefined (the default) leaves Host unchecked, because this service is
  // fronted by Caddy which preserves the original Host, so a fixed loopback list would reject the proxied public
  // deployment. A loopback-only or host-pinned deployment sets APPSMITH_MCP_ALLOWED_HOSTS to enforce it.
  allowedHosts?: string[];
}

// The hostname portion of a Host header, lowercased and without the port. Handles `host`, `host:port`, and
// bracketed IPv6 (`[::1]:port` -> `::1`). Returns "" for a missing/empty header. Exported for direct unit testing.
export function hostHeaderName(hostHeader: unknown): string {
  if (typeof hostHeader !== "string") return "";

  const trimmed = hostHeader.trim();

  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");

    return (end > 0 ? trimmed.slice(1, end) : trimmed).toLowerCase();
  }

  const colon = trimmed.indexOf(":");

  return (colon >= 0 ? trimmed.slice(0, colon) : trimmed).toLowerCase();
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
  createApi: (
    token: string,
    requestHeaders?: Record<string, string>,
  ) => AppsmithApi = (token, requestHeaders) =>
    createAppsmithApi(token, apiBaseUrl, fetch, requestHeaders),
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
  const jsEnabled = options.jsEnabled ?? false;
  const governance = options.governance;
  const allowedHosts = new Set(
    (options.allowedHosts ?? [])
      .map((host) => host.trim().toLowerCase())
      .filter((host) => host.length > 0),
  );

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
    const startedAt = Date.now();
    const upstreamHeaders = correlationHeaders(req);
    const requestId = upstreamHeaders["X-Appsmith-Request-Id"];
    let username: string | undefined;
    let operation: { method?: string; tool?: string } = {};

    res.once("finish", () => {
      logMcpEvent("appsmith_mcp_request", {
        requestId,
        path: (req.url ?? "").split("?")[0],
        httpMethod: req.method,
        mcpMethod: operation.method,
        tool: operation.tool,
        username,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

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

      // Configured Host allowlist (defense-in-depth against DNS rebinding, where the request arrives with the
      // attacker's hostname in Host). Enforced only when APPSMITH_MCP_ALLOWED_HOSTS is set — see McpHttpServerOptions.
      // Checked before any auth/session/transport work so a rejected request never creates a session.
      if (
        allowedHosts.size > 0 &&
        !allowedHosts.has(hostHeaderName(req.headers.host))
      ) {
        writeJson(res, 403, { error: "host not allowed" });

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

      operation = requestOperation(body);
      let transport = session?.transport;

      if (session) {
        if (!tokensMatch(session.token, token)) {
          // Do NOT evict the session here: a mismatched token must not let someone who guessed/leaked a session id
          // tear down the real owner's session (targeted DoS). The owner's own token still binds it.
          writeJson(res, 401, { error: "invalid MCP session" });

          return;
        }

        username = await authenticatedUsername(
          createApi(token, upstreamHeaders),
        );
        session.expiresAt = now() + sessionTtlMs;
      }

      if (!transport && isInitializeRequest(body)) {
        const api = createApi(token, upstreamHeaders);
        const authenticatedUser = await authenticatedUsername(api);

        username = authenticatedUser;

        // Check-and-reserve synchronously (no await between reading the counts and incrementing the reservation)
        // so a burst of concurrent initializes can't all slip past the caps. `sessions.size + pendingTotal` counts
        // both registered and in-flight sessions.
        let userSessionCount = pendingByUser.get(authenticatedUser) ?? 0;

        for (const existing of sessions.values()) {
          if (existing.username === authenticatedUser) userSessionCount += 1;
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
        pendingByUser.set(
          authenticatedUser,
          (pendingByUser.get(authenticatedUser) ?? 0) + 1,
        );
        releasePending = () => {
          releasePending = () => {};
          pendingTotal -= 1;
          const remaining = (pendingByUser.get(authenticatedUser) ?? 1) - 1;

          if (remaining <= 0) pendingByUser.delete(authenticatedUser);
          else pendingByUser.set(authenticatedUser, remaining);
        };

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          onsessioninitialized: (id) => {
            sessions.set(id, {
              expiresAt: now() + sessionTtlMs,
              token,
              username: authenticatedUser,
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
        await buildMcpServer(api, {
          dataEnabled,
          jsEnabled,
          governance,
          actorId: authenticatedUser,
        }).connect(transport);
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
