import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ErrorCode,
  isInitializeRequest,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
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
  eventActionKinds,
  eventReferences,
  widgetExists,
  wireEventSpecSchema,
} from "./builder/events.js";
import { applyWidgetPatch, widgetPatchSchema } from "./builder/editPatch.js";
import {
  FIELDS_FORMAT,
  getInstructionDoc,
  GUIDES,
  INSTRUCTION_DOCS,
  type InstructionDoc,
  RECIPES,
  scaffoldCrudPlan,
  scaffoldFormPlan,
  SERVER_INSTRUCTIONS,
  WIDGET_REFERENCE,
} from "./builder/instructions.js";
import type { WidgetNode } from "./builder/layout.js";
import { lintArtifact, lintDsl } from "./builder/lint.js";
import { overlapDelta, suggestedFix } from "./builder/occupancy.js";
import { evaluateModalWiring } from "./builder/modalGraph.js";
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
  buildMongoActionDto,
  compileMongoQuery,
  mongoQuerySpecSchema,
} from "./builder/mongoQuery.js";
import {
  buildSheetsActionDto,
  compileSheetsQuery,
  sheetsQuerySpecSchema,
} from "./builder/sheetsQuery.js";
import {
  buildRedisActionDto,
  compileRedisQuery,
  redisQuerySpecSchema,
} from "./builder/redisQuery.js";
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
import { MCP_BUILD_INFO } from "./buildInfo.js";
import {
  GitGateCache,
  GIT_GATE_NOT_CONNECTED_TTL_MS,
  fingerprintBranchList,
  gitBranchNames,
  gitEditWarning,
  gitMetadataOf,
  gitStateOf,
  projectGitStatus,
  type GitMetadataProjection,
  type GitState,
} from "./git/projections.js";
import {
  MCP_COMMIT_MARKER,
  MCP_COMMIT_MESSAGE_MAX,
  commitMessageProblem,
  promptSafe,
  truncateForPrompt,
} from "./prompt/hygiene.js";

// Re-exported so existing importers (tests and other modules that import these by name from "./app.js") keep working
// after M8 moved the definitions into cohesive modules. Pure code-movement — no behavior change.
export { MCP_BUILD_INFO };
export { GitGateCache, GIT_GATE_NOT_CONNECTED_TTL_MS };
export type { GitState };
export { MCP_COMMIT_MARKER, MCP_COMMIT_MESSAGE_MAX, commitMessageProblem };

// Safe audit-record projection for the history tools: never returns the rollback snapshot (it can hold full DSL) —
// only metadata and the semantic summary, plus whether a safe rollback exists.
function isLayoutRollbackable(change: McpChangeRecord): boolean {
  const rollback = change.rollback as { kind?: unknown; dsl?: unknown };

  return rollback?.kind === "layout" && rollback.dsl !== undefined;
}

// `includeActor` adds the actorId so a cross-actor admin audit read can attribute each change to a user; the
// per-actor list_changes omits it (it is always the caller). The rollback snapshot is never projected.
function projectChange(
  change: McpChangeRecord,
  includeActor = false,
): Record<string, unknown> {
  return {
    id: change.id,
    ...(includeActor ? { actorId: change.actorId } : {}),
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
  // True when the authenticated user is an instance SUPER-admin (isSuperUser on /api/v1/users/me). Gates the
  // cross-actor audit read (list_all_changes / get_any_change); a normal actor only ever sees its own change records.
  // NOTE: on a multi-org (EE) deployment isSuperUser is a PER-ORG signal (MANAGE_ORGANIZATION on the caller's own
  // org), so it does not by itself bound the read to one tenant — organizationId below does that.
  isAdmin?: boolean;
  // The caller's Appsmith organization (tenant), from organizationId on /api/v1/users/me. EVERY governance audit
  // read is scoped to it so one tenant can never read another's change history; it is stamped onto each change
  // record at write time. Empty when the server does not report it, which fails closed: org-scoped reads then match
  // no records rather than falling back to an unscoped (cross-tenant) query.
  organizationId?: string;
  // Absolute http(s) origin used to build the editor/viewer URLs build_application returns, resolved ONCE per
  // session at initialize (handlers never see raw requests): options.publicOrigin, else strictly validated
  // X-Forwarded-Proto + Host headers, else undefined — which degrades every constructed URL to a root-relative path.
  requestOrigin?: string;
  // How long every destructive confirm tool waits for the human to answer its elicitation prompt (default
  // MCP_ELICITATION_TIMEOUT_MS). Injectable so tests don't wait 120s for the timeout path.
  elicitationTimeoutMs?: number;
  // Deprecated alias for elicitationTimeoutMs (from when only confirm_commit prompted); elicitationTimeoutMs wins
  // when both are set.
  commitElicitationTimeoutMs?: number;
  // Interval between notifications/progress pings while an elicitation prompt waits for the human (sent only when
  // the CALLER supplied a progressToken). Default ELICITATION_PROGRESS_INTERVAL_MS; injectable like the timeout so
  // tests can observe pings without a 10s wait.
  elicitationProgressIntervalMs?: number;
  // Operator escape hatch (APPSMITH_MCP_DISABLE_ELICITATION): forces the documented relay posture — no
  // elicitation prompt is ever sent, even when the client declares the capability. For deployments whose client
  // fleet declares elicitation but cannot render it. No other server rule (tokens, TTLs, digests) relaxes.
  elicitationDisabled?: boolean;
  // Operator strict mode (APPSMITH_MCP_STRICT_ELICITATION): the OPPOSITE posture — an in-band approval prompt
  // is REQUIRED. Non-elicitation clients are refused (elicitation_required) instead of relayed, and a
  // client_error never degrades the session to the relay posture. Overrides elicitationDisabled when both are
  // set (contradictory config fails safe to the stricter posture).
  elicitationStrict?: boolean;
  // Operator-facing log line sink (default: process.stderr). Injectable so tests can observe telemetry.
  logSink?: (line: string) => void;
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
export const MAX_MCP_SESSIONS_PER_USER = 25;
export const MCP_SESSION_TTL_MS = 15 * 60 * 1000;
export const REQUEST_TIMEOUT_MS = 30 * 1000;
// The git commit API exports the whole application, commits, AND pushes — on large apps that comfortably exceeds
// the default 30s outbound abort, so the commit call alone gets a longer budget [COUNCIL: architect].
export const GIT_COMMIT_TIMEOUT_MS = 120 * 1000;
export const HEADERS_TIMEOUT_MS = 10 * 1000;
export const MAX_INBOUND_CONNECTIONS = 512;
const MCP_TOKEN_PREFIX = "mcp_";
const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ID_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/);
// The M7-T1 branch-gate parameter carried by every mutating tool that targets an application. Deliberately loose
// (git branch names allow '/', '.', …): it is only ever compared for equality against the server-side branch name,
// never embedded in a path or emitted content.
const gitBranchParamSchema = z
  .string()
  .min(1)
  .max(255)
  .describe(
    "REQUIRED when the target application is connected to git: the app's current branch name (from read_git_status). Ignored for non-git apps.",
  );
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

// Upstream Appsmith API failure carrying the HTTP status and — when the error body was parseable — the Appsmith
// error code (e.g. "AE-GIT-4031" for INVALID_GIT_CONFIGURATION), so tool handlers can map specific upstream
// failures to agent-legible errors without ever forwarding the raw response body.
export class AppsmithApiError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode?: string,
  ) {
    super(
      `Appsmith API request failed (${status})${errorCode !== undefined ? ` [${errorCode}]` : ""}`,
    );
    this.name = "AppsmithApiError";
  }
}

// AppsmithErrorCode.INVALID_GIT_CONFIGURATION — the commit path returns this when the caller has no git author
// profile configured (and for other broken git configs). Verified against AppsmithErrorCode.java.
const INVALID_GIT_CONFIGURATION_CODE = "AE-GIT-4031";

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
  // Returns a single page's DTO (GET /api/v1/pages/{pageId}), whose `layouts[0].id` is the layoutId REQUIRED by the
  // authoring tools (read_semantic_page/patch_widgets/edit_page/wire_event). The pages-LIST DTO does not carry it.
  getPage: (pageId: string) => Promise<unknown>;
  // Returns the Application SUB-OBJECT of the pages DTO (GET /api/v1/pages?applicationId=...&mode=EDIT ->
  // ApplicationPagesDTO.application), whose gitApplicationMetadata reveals whether the app is connected to git and
  // which branch is checked out — used to guard mutations/publish on git-connected apps. There is NO GET
  // /api/v1/applications/{id} route (405), so the pages DTO is the working source; returning `.application` (not the
  // whole DTO) keeps gitApplicationMetadata present so git apps are not silently read as "not connected".
  getApplication: (applicationId: string) => Promise<unknown>;
  // --- Git (M7) — wrappers over /api/v1/git/applications/* (GitApplicationControllerCE). ---
  // Local git status of a branched application. compareRemote is ALWAYS passed explicitly because the server
  // defaults the query param to true (a remote fetch: slow, remote egress, git locks); the MCP default is false.
  getGitStatus: (
    branchedApplicationId: string,
    compareRemote: boolean,
  ) => Promise<unknown>;
  // Protected branch names, stored on the BASE artifact (gitApplicationMetadata.defaultApplicationId).
  getGitProtectedBranches: (baseArtifactId: string) => Promise<unknown>;
  // Branch list (GET .../refs?refType=branch) — enforces the mcp/ branch cap for create_branch.
  listGitBranches: (branchedApplicationId: string) => Promise<unknown>;
  // POST .../create-ref: creates a new branch application from the source branched application's CURRENT
  // (possibly uncommitted) state and PUSHES the new ref to the customer remote immediately (remote egress; can
  // trigger remote CI/webhooks). Returns the NEW branched application document.
  createGitBranch: (
    referencedApplicationId: string,
    branchName: string,
  ) => Promise<unknown>;
  // POST .../commit (GitApplicationControllerCE.commit, CommitDTO body): commits the branched application's CURRENT
  // state AND PUSHES to the customer remote (GitFSServiceCEImpl.commitArtifact pushes unconditionally — there is no
  // commit-without-push). The wire body carries ONLY { message, isAmendCommit: false }: CommitDTO.author/committer
  // are never sent (identity derives from the session user server-side) and amend is pinned off (append-only).
  // Uses the longer GIT_COMMIT_TIMEOUT_MS outbound budget (export + commit + push on large apps).
  commitGitApplication: (
    branchedApplicationId: string,
    message: string,
  ) => Promise<unknown>;
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

  async function request<T>(
    path: string,
    init?: RequestInit,
    opts?: { timeoutMs?: number; extractErrorCode?: boolean },
  ): Promise<T> {
    const isMultipart = init?.body instanceof FormData;
    // Bound every upstream call so a hung Appsmith response cannot pin an MCP worker indefinitely. Preserve a
    // caller-supplied signal when present; otherwise abort on our own timeout (default 30s; the git commit call
    // passes a longer budget because it exports + commits + pushes).
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      opts?.timeoutMs ?? REQUEST_TIMEOUT_MS,
    );

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
        // Opt-in only: callers that need to map a SPECIFIC upstream failure (e.g. the commit path's
        // INVALID_GIT_CONFIGURATION) get the Appsmith error code off the error body. The default path is
        // unchanged — status only, body never read.
        if (opts?.extractErrorCode === true) {
          let errorCode: string | undefined;

          try {
            const errorBody = (await response.json()) as {
              responseMeta?: { error?: { code?: unknown } };
            } | null;
            const code = errorBody?.responseMeta?.error?.code;

            errorCode = typeof code === "string" ? code : undefined;
          } catch {
            // Unparseable error body: fall through with the status only.
          }

          throw new AppsmithApiError(response.status, errorCode);
        }

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
    getPage: async (pageId) =>
      request(`/api/v1/pages/${encodeURIComponent(pageId)}`),
    // No GET /api/v1/applications/{id} exists (405). Source the Application from the pages DTO, returning its
    // `.application` SUB-OBJECT (carries gitApplicationMetadata/name/slug). Returning the whole DTO would leave
    // gitApplicationMetadata undefined -> git apps silently read "not connected" -> the branch/publish gates disable.
    getApplication: async (applicationId) =>
      (
        (await request(
          `/api/v1/pages?applicationId=${encodeURIComponent(applicationId)}&mode=EDIT`,
        )) as { application?: unknown } | null
      )?.application,
    getGitStatus: async (branchedApplicationId, compareRemote) =>
      request(
        `/api/v1/git/applications/${encodeURIComponent(branchedApplicationId)}/status?compareRemote=${compareRemote ? "true" : "false"}`,
      ),
    getGitProtectedBranches: async (baseArtifactId) =>
      request(
        `/api/v1/git/applications/${encodeURIComponent(baseArtifactId)}/protected-branches`,
      ),
    listGitBranches: async (branchedApplicationId) =>
      request(
        `/api/v1/git/applications/${encodeURIComponent(branchedApplicationId)}/refs?refType=branch`,
      ),
    createGitBranch: async (referencedApplicationId, branchName) =>
      request(
        `/api/v1/git/applications/${encodeURIComponent(referencedApplicationId)}/create-ref`,
        {
          method: "POST",
          // RefType enum constants are lowercase on the server ("branch" | "tag").
          body: JSON.stringify({ refName: branchName, refType: "branch" }),
        },
      ),
    commitGitApplication: async (branchedApplicationId, message) =>
      request(
        `/api/v1/git/applications/${encodeURIComponent(branchedApplicationId)}/commit`,
        {
          method: "POST",
          // CommitDTO (verified against CommitDTO.java): { message, header, isAmendCommit, author, committer }.
          // Send ONLY message + isAmendCommit pinned false — author/committer/header must never cross the wire
          // (identity always derives from the session user server-side) [COUNCIL: security F5].
          body: JSON.stringify({ message, isAmendCommit: false }),
        },
        // Longer outbound budget + error-code extraction for the INVALID_GIT_CONFIGURATION mapping.
        { timeoutMs: GIT_COMMIT_TIMEOUT_MS, extractErrorCode: true },
      ),
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
          // ActionCollectionControllerCE exposes @PatchMapping("/{id}") for this
          // update (PUT /{id} is not mapped -> 405); buildUpdateJsObjectRequest
          // likewise declares method "PATCH". A prior hardcoded PUT here 405'd on
          // every js-object update — a live M9-class route mismatch the F5
          // route-contract test surfaced. Keep PATCH to match the served route.
          method: "PATCH",
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
  "redshift-plugin",
  "snowflake-plugin",
]);
const REST_PLUGIN_IDS = new Set(["restapi-plugin"]);
// Mongo and Google Sheets each need their own typed builder (they are NOT SQL and NOT REST): create_mongo_query emits
// the Mongo formData FIND/INSERT command, create_sheets_query emits the Sheets FETCH_MANY/INSERT_ONE command. Family
// membership is checked by packageName, resolved from the workspace plugin list.
const MONGO_PLUGIN_IDS = new Set(["mongo-plugin"]);
const SHEETS_PLUGIN_IDS = new Set(["google-sheets-plugin"]);
// D3: create_redis_query emits the Redis plugin's single-command `actionConfiguration.body` from a closed command
// vocabulary. Like Sheets, the Redis datasource is created in the Appsmith UI (host/port, optional auth) and queried
// here by datasourceId — the connection's DB-index/optional-auth shape doesn't fit the shared database builder.
const REDIS_PLUGIN_IDS = new Set(["redis-plugin"]);

// CE keys every datasource storage under this fixed environment id (FieldNameCE.UNUSED_ENVIRONMENT_ID).
const DEFAULT_ENVIRONMENT_ID = "unused_env";

// The closed set of DATABASE plugin families create_datasource can provision. All share the endpoints + dbAuth
// configuration shape (verified against each plugin's form.json — Mongo's form.json exposes the same
// endpoints[host,port] + authentication{databaseName,username} + connection.mode fields). Credentials are never part
// of the vocabulary; the password is completed by a human in the Appsmith UI. packageNames are sourced from the
// client PluginPackageName enum (app/client/src/entities/Plugin/index.ts) and the server plugin seed data.
// D1: oracle and redshift join the shared shape — their form.json datasource config is the SAME
// endpoints[host,port] + authentication{databaseName,username,password} + connection.mode shape (verified against
// oraclePlugin/redshiftPlugin form.json), and both are SQL (create_query works via SQL_PLUGIN_IDS). Snowflake and
// databricks are intentionally NOT here: their datasource config is bespoke (account/warehouse or host/httpPath +
// token, no endpoints[host,port]), so they don't fit this builder or the "reuse existing query builders" scope.
const CREATABLE_DATASOURCE_PLUGINS: Record<
  "postgresql" | "mysql" | "mssql" | "mongodb" | "oracle" | "redshift",
  { packageName: string; defaultPort: number }
> = {
  postgresql: { packageName: "postgres-plugin", defaultPort: 5432 },
  mysql: { packageName: "mysql-plugin", defaultPort: 3306 },
  mssql: { packageName: "mssql-plugin", defaultPort: 1433 },
  mongodb: { packageName: "mongo-plugin", defaultPort: 27017 },
  oracle: { packageName: "oracle-plugin", defaultPort: 1521 },
  redshift: { packageName: "redshift-plugin", defaultPort: 5439 },
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

function isMongoDatasource(
  list: unknown,
  plugins: unknown,
  datasourceId: string,
): boolean {
  return datasourceInPluginFamily(
    list,
    plugins,
    datasourceId,
    MONGO_PLUGIN_IDS,
  );
}

function isSheetsDatasource(
  list: unknown,
  plugins: unknown,
  datasourceId: string,
): boolean {
  return datasourceInPluginFamily(
    list,
    plugins,
    datasourceId,
    SHEETS_PLUGIN_IDS,
  );
}

function isRedisDatasource(
  list: unknown,
  plugins: unknown,
  datasourceId: string,
): boolean {
  return datasourceInPluginFamily(
    list,
    plugins,
    datasourceId,
    REDIS_PLUGIN_IDS,
  );
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

// The application's display name off an ApplicationPagesDTO read (used in commit confirmation prompts).
function applicationNameOf(pagesResponse: unknown): string | undefined {
  const name = (pagesResponse as { application?: { name?: unknown } } | null)
    ?.application?.name;

  return typeof name === "string" && name.length > 0 ? name : undefined;
}

// Adapt an ApplicationPagesDTO (GET /pages?applicationId=...) into the applicationUrls inputs so tools that already
// hold a pages read (confirm_commit) can build the editor URL without a second fetch. Same charset rules: missing
// or unsafe slugs OMIT the URL, never guess.
function applicationUrlsFromPages(
  origin: string | undefined,
  pagesResponse: unknown,
): { editorUrl?: string; viewerUrl?: string } {
  const application = (
    pagesResponse as { application?: { slug?: unknown } } | null
  )?.application;
  const slug =
    typeof application?.slug === "string" && application.slug.length > 0
      ? application.slug
      : undefined;
  const rawPages = (pagesResponse as { pages?: unknown } | null)?.pages;
  const pages: ImportedPage[] = Array.isArray(rawPages)
    ? rawPages.flatMap((page) => {
        const entry = page as {
          id?: unknown;
          slug?: unknown;
          isDefault?: unknown;
        } | null;

        if (typeof entry?.id !== "string" || entry.id.length === 0) return [];

        return [
          {
            id: entry.id,
            ...(typeof entry.slug === "string" && entry.slug.length > 0
              ? { slug: entry.slug }
              : {}),
            ...(typeof entry.isDefault === "boolean"
              ? { isDefault: entry.isDefault }
              : {}),
          },
        ];
      })
    : [];

  return applicationUrls(origin, slug, pages);
}

// The layoutId of a single-page DTO (PageDTO.layouts[0].id), which the authoring tools require as input. The
// pages-LIST DTO does not carry layouts, so this reads a single page fetched via getPage. Absent/malformed -> undefined.
function layoutIdOf(page: unknown): string | undefined {
  const layouts = (page as { layouts?: unknown } | null)?.layouts;

  if (!Array.isArray(layouts) || layouts.length === 0) return undefined;

  const id = (layouts[0] as { id?: unknown } | null)?.id;

  return typeof id === "string" && id.length > 0 ? id : undefined;
}

// The default page's layoutId, sourced from GET /api/v1/pages/{pageId} (one extra fetch per page). layoutId is an
// additive convenience for the authoring tools — never load-bearing for a build — so any absence or fetch failure
// degrades to undefined rather than surfacing an error.
async function defaultPageLayoutId(
  api: AppsmithApi,
  pagesResponse: unknown,
): Promise<string | undefined> {
  const rawPages = (pagesResponse as { pages?: unknown } | null)?.pages;

  if (!Array.isArray(rawPages) || rawPages.length === 0) return undefined;

  const defaultPage =
    rawPages.find(
      (page) => (page as { isDefault?: unknown } | null)?.isDefault === true,
    ) ?? rawPages[0];
  const pageId = (defaultPage as { id?: unknown } | null)?.id;

  if (typeof pageId !== "string" || pageId.length === 0) return undefined;

  try {
    return layoutIdOf(await api.getPage(pageId));
  } catch {
    return undefined;
  }
}

// Max concurrent per-page getPage fetches in read_pages. Small pool: keeps a 1–5 page app effectively parallel
// while bounding a 50-page app to a few sequential waves instead of one N-wide burst of full-DSL reads.
export const READ_PAGES_LAYOUT_CONCURRENCY = 6;

// Map over items with at most `limit` promises in flight at once, preserving input order in the result. Used to
// keep per-page fan-out (read_pages' getPage-per-page) from firing an unbounded burst at the server on large apps
// (each getPage materializes a full page DSL server-side); a small pool caps the worst case while keeping the
// common few-page case effectively parallel. Mirrors the shape of Promise.all(items.map(fn)) it replaces.
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;

      results[index] = await fn(items[index], index);
    }
  };
  const size = Math.max(1, Math.min(limit, items.length));
  const workers: Promise<void>[] = [];

  for (let slot = 0; slot < size; slot++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  return results;
}

// Explicit elicitInput timeout: the human may deliberate, so the wait is 120s (with progress notifications during
// the wait so timeout-resetting clients don't abort the tool call underneath the prompt) [COUNCIL: architect].
// Shared by EVERY destructive confirm tool (generalized from confirm_commit's M7 machinery).
export const MCP_ELICITATION_TIMEOUT_MS = 120 * 1000;
// Bound re-prompting: non-accept answers do NOT consume the one-time confirmation, so at most this many elicitation
// prompts per confirmationId — then the token is invalidated (prompt-fatigue guard) [SECURITY REV-2 CONDITION 2].
export const MCP_MAX_ELICITATIONS = 3;
// SESSION-TOTAL budget on destructive-approval prompts, across ALL confirmations (the per-confirmation bound alone
// still allows a prepare -> 3 prompts -> re-prepare loop to nag the human indefinitely). Once a session has sent
// this many prompts, elicitation-capable confirms REFUSE with a clear error instead of prompting — they never fall
// back to executing without the human's answer. A fresh session resets the budget.
export const MCP_SESSION_MAX_ELICITATIONS = 20;
// Back-compat aliases from when only confirm_commit prompted; prefer the operation-neutral names above.
export const MCP_COMMIT_ELICITATION_TIMEOUT_MS = MCP_ELICITATION_TIMEOUT_MS;
export const MCP_COMMIT_MAX_ELICITATIONS = MCP_MAX_ELICITATIONS;
const ELICITATION_PROGRESS_INTERVAL_MS = 10 * 1000;

// The import endpoint returns an ApplicationImportDTO ({ application, isPartialImport, ... }); tolerate a bare
// application object too (older shapes/fixtures). Extracts exactly what URL construction and auto-publish need:
// the application id/slug and each page's id/slug/isDefault. Nothing else from the response is interpreted.
interface ImportedPage {
  id: string;
  slug?: string;
  isDefault?: boolean;
}

function projectImportedApplication(imported: unknown): {
  applicationId?: string;
  applicationSlug?: string;
  pages: ImportedPage[];
} {
  const root = imported as { application?: unknown } | null;
  const application = (root?.application ?? imported) as {
    id?: unknown;
    slug?: unknown;
    pages?: unknown;
  } | null;

  const pages: ImportedPage[] = Array.isArray(application?.pages)
    ? application.pages.flatMap((page) => {
        if (page === null || typeof page !== "object") return [];

        const entry = page as {
          id?: unknown;
          slug?: unknown;
          isDefault?: unknown;
        };

        if (typeof entry.id !== "string" || entry.id.length === 0) return [];

        return [
          {
            id: entry.id,
            ...(typeof entry.slug === "string" && entry.slug.length > 0
              ? { slug: entry.slug }
              : {}),
            ...(typeof entry.isDefault === "boolean"
              ? { isDefault: entry.isDefault }
              : {}),
          },
        ];
      })
    : [];

  return {
    applicationId:
      typeof application?.id === "string" && application.id.length > 0
        ? application.id
        : undefined,
    applicationSlug:
      typeof application?.slug === "string" && application.slug.length > 0
        ? application.slug
        : undefined,
    pages,
  };
}

// The slugs/ids come from the Appsmith server, but each URL segment is still charset-checked before it is embedded
// in a path: if any segment is missing or would not survive as a literal path piece, the URLs are OMITTED (the ids
// are still returned) — never a guessed or broken path [COUNCIL: slug fallback].
const URL_PATH_SEGMENT = /^[A-Za-z0-9_-]+$/;

function applicationUrls(
  origin: string | undefined,
  applicationSlug: string | undefined,
  pages: ImportedPage[],
): { editorUrl?: string; viewerUrl?: string } {
  const defaultPage = pages.find((page) => page.isDefault) ?? pages[0];

  if (
    applicationSlug === undefined ||
    !URL_PATH_SEGMENT.test(applicationSlug) ||
    defaultPage?.slug === undefined ||
    !URL_PATH_SEGMENT.test(defaultPage.slug) ||
    !URL_PATH_SEGMENT.test(defaultPage.id)
  ) {
    return {};
  }

  // Absolute when an origin is available (env override or validated session headers); root-relative otherwise.
  const viewerUrl = `${origin ?? ""}/app/${applicationSlug}/${defaultPage.slug}-${defaultPage.id}`;

  return { editorUrl: `${viewerUrl}/edit`, viewerUrl };
}

// Coarse outcome class for an auto-publish failure ("created but not deployed: <class>" + telemetry). Only the
// upstream HTTP status class survives — the raw error message is never surfaced (it can carry response details).
function publishFailureClass(error: unknown): string {
  const match =
    error instanceof Error ? /\((\d{3})\)/.exec(error.message) : null;

  return match ? mcpStatusClass(Number(match[1])) : "error";
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

// Best-effort human-facing facts about a stored action for destructive-approval prompts: the action's name plus a
// datasource label (name, with the host appended when the embedded datasource carries a parseable URL). Never
// load-bearing — the confirmation digest binds the ids, not these labels — and never a secret: only the name and
// host, mirroring read_git_status's host-only rule.
function actionPromptFacts(action: unknown): {
  name?: string;
  datasource?: string;
} {
  const source = actionSource(action) as {
    name?: unknown;
    datasource?: {
      name?: unknown;
      datasourceConfiguration?: { url?: unknown };
    };
  } | null;
  const name =
    typeof source?.name === "string" && source.name.length > 0
      ? source.name
      : undefined;
  const datasourceName = source?.datasource?.name;
  const url = source?.datasource?.datasourceConfiguration?.url;
  let host: string | undefined;

  if (typeof url === "string") {
    try {
      host = new URL(url).host || undefined;
    } catch {
      // Not a parseable URL — omit the host rather than guess.
    }
  }

  const datasource =
    typeof datasourceName === "string" && datasourceName.length > 0
      ? host !== undefined
        ? `${datasourceName} (${host})`
        : datasourceName
      : host;

  return {
    ...(name !== undefined ? { name } : {}),
    ...(datasource !== undefined ? { datasource } : {}),
  };
}

// Fetches the application and returns its git state. Fails safe to "not connected" on a read error so a transient
// failure never blocks a legitimate read; the M7 branch GATE never uses this (it fails closed instead), and
// confirm_publish re-reads explicitly before the high-impact deploy.
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

// The fail-CLOSED branch-gate verdict when the app's git state could not be read (a thrown request OR a 2xx that
// carried no application object). Shared so both failure modes return the identical git_state_unknown refusal.
function unreadableGitState(): { error: ToolResult } {
  return {
    error: result({
      error: "could not verify the application's git state; retry",
      code: "git_state_unknown",
    }),
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
  const {
    actorId,
    commitElicitationTimeoutMs,
    dataEnabled,
    elicitationDisabled,
    elicitationProgressIntervalMs,
    elicitationStrict,
    elicitationTimeoutMs,
    governance,
    isAdmin,
    jsEnabled,
    requestOrigin,
  } = ctx;
  // Tenant scope for every governance audit read/write. Empty string when unreported → org-scoped queries match
  // nothing (fail-closed), never an unscoped cross-tenant read.
  const organizationId = ctx.organizationId ?? "";
  const logSink = ctx.logSink ?? ((line: string) => process.stderr.write(line));
  const elicitationTimeout =
    elicitationTimeoutMs ??
    commitElicitationTimeoutMs ??
    MCP_ELICITATION_TIMEOUT_MS;
  const elicitationProgressInterval =
    elicitationProgressIntervalMs ?? ELICITATION_PROGRESS_INTERVAL_MS;
  const server = new McpServer(
    { name: "appsmith-mcp", version: MCP_BUILD_INFO.version },
    { instructions: SERVER_INSTRUCTIONS },
  );

  // Session-scoped cache for the branch gate's git-state reads (see GitGateCache for the binding caching rules).
  const gitGateCache = new GitGateCache();

  // Fail-closed, cached git-state read for the branch gate (M7-T1). Unlike the advisory fetchGitState (fail-open:
  // a read error degrades to "not connected"), a read error here REJECTS the mutation — the gate exists to prove
  // the agent read the app's git state, so it must not be satisfiable by an unreadable one. Errors are never cached.
  async function gateGitState(
    applicationId: string,
  ): Promise<{ state: GitState } | { error: ToolResult }> {
    const cached = gitGateCache.get(applicationId);

    if (cached !== undefined) return { state: cached };

    try {
      const application = await api.getApplication(applicationId);

      // A 2xx with no application object (malformed/missing payload) means we could NOT actually read the app's git
      // state. Fail CLOSED, exactly like a thrown read: otherwise gitStateOf(undefined) -> {connected:false} and a
      // git-connected app whose application failed to materialize would silently bypass the branch gate. (The pages
      // DTO always carries `application` on a real 200, so this is defense-in-depth for the residual edge.) The
      // advisory fail-open fetchGitState is intentionally NOT changed — there, undefined -> not-connected is correct.
      if (application === null || application === undefined) {
        return unreadableGitState();
      }

      const state = gitStateOf(application);

      gitGateCache.set(applicationId, state);

      return { state };
    } catch {
      return unreadableGitState();
    }
  }

  // The M7-T1 branch gate: every mutation on a git-CONNECTED application requires `branch` to equal the app's
  // current branch. Branch-per-application means the branch of a given applicationId never changes, so this proves
  // the agent READ the git status (not freshness). Both error codes carry the current branch, making recovery a
  // single retry. Non-git apps ignore the parameter entirely (zero behavior change).
  async function gitBranchGate(
    applicationId: string,
    branch: string | undefined,
  ): Promise<
    { ok: true; gitWarning?: string } | { ok: false; result: ToolResult }
  > {
    const read = await gateGitState(applicationId);

    if ("error" in read) return { ok: false, result: read.error };

    const { state } = read;

    if (!state.connected) return { ok: true };

    if (state.branchName === undefined) {
      // Connected but the branch is unreadable: fail closed like a read error rather than gate against a blank.
      return {
        ok: false,
        result: result({
          error: "could not verify the application's git branch; retry",
          code: "git_state_unknown",
        }),
      };
    }

    if (branch === undefined) {
      return {
        ok: false,
        result: result({
          error: `this application is connected to git on branch "${state.branchName}". Read its git state (read_git_status), then retry this call with branch: "${state.branchName}".`,
          code: "git_branch_required",
          currentBranch: state.branchName,
        }),
      };
    }

    if (branch !== state.branchName) {
      return {
        ok: false,
        result: result({
          error: `this application's branch is "${state.branchName}", not "${branch}". Re-read its git state (read_git_status) and retry with branch: "${state.branchName}".`,
          code: "git_branch_changed",
          currentBranch: state.branchName,
        }),
      };
    }

    return { ok: true, gitWarning: gitEditWarning(state) };
  }

  // --- Shared elicitation layer for EVERY destructive confirm tool (generalized from confirm_commit's M7-T3
  // machinery). ONE mechanism: a session-local attempt counter keyed by confirmationId. Non-accept answers never
  // consume the one-time confirmation, so re-prompting is bounded at MCP_MAX_ELICITATIONS per confirmation — then
  // the token is invalidated (prompt-fatigue guard) [SECURITY REV-2 CONDITION 2]. Entries are swept lazily once
  // they outlive any confirmation they could belong to (the gov token TTL is 5 minutes; sweep at 10). -------------
  const elicitationAttempts = new Map<
    string,
    { count: number; spent?: boolean; expiresAt: number }
  >();
  const ELICITATION_ATTEMPTS_TTL_MS = 10 * 60 * 1000;
  // Session-total prompt counter behind MCP_SESSION_MAX_ELICITATIONS (see the constant for the rationale).
  let sessionElicitationCount = 0;
  // Set after a client_error prompt outcome: the client declares elicitation but cannot deliver the dialog, so
  // the rest of the session uses the documented relay posture instead of prompting into a dead end.
  let elicitationFallback = false;
  // Strict-mode resource cap [SECURITY: B3/A7 review Risk 1]: refunded client_error outcomes never charge the
  // prompt budgets, so an endlessly erroring client could otherwise loop elicitInput attempts forever. After
  // this many refunded errors, strict sessions refuse further prompt attempts outright.
  const MCP_STRICT_MAX_CLIENT_ERRORS = 3;
  let strictClientErrorCount = 0;

  // Operator telemetry: one line per elicitation outcome, with the client identity from the initialize
  // handshake — so a client fleet that declares elicitation but cannot render it is identifiable from server
  // logs instead of user screenshots. The client name/version is client-supplied text: control characters are
  // flattened like every other client-controlled string the server echoes.
  function logElicitationOutcome(tool: string, outcome: string): void {
    const clientInfo = server.server.getClientVersion();
    const clientLabel = (
      clientInfo ? `${clientInfo.name}/${clientInfo.version}` : "unknown"
    )
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .slice(0, 120);

    logSink(
      `Appsmith MCP elicitation tool=${tool} outcome=${outcome} client=${clientLabel}\n`,
    );
  }

  // Marks a confirmation as spent the moment its token is consumed, so a replayed confirm call refuses WITHOUT
  // prompting the human again (the prompt fires before consumption, so only this session-local mark can stop a
  // dead token from generating another prompt). Confirm handlers call this right after a successful consume.
  function markElicitationConsumed(confirmationId: string): void {
    elicitationAttempts.set(confirmationId, {
      count: MCP_MAX_ELICITATIONS,
      spent: true,
      expiresAt: Date.now() + ELICITATION_ATTEMPTS_TTL_MS,
    });
  }

  interface DestructiveElicitation {
    confirmationId: string;
    // Builds the human-facing prompt. Invoked ONLY when the client declares elicitation, so any best-effort label
    // read it performs never costs non-elicitation clients anything. EVERY interpolated value must pass through
    // promptSafe(), with the load-bearing facts rendered OUTSIDE any quoted agent text, and the wording must never
    // make an itemized claim the confirmation digest does not bind [SECURITY REV-2 CONDITION 4]. MUST NOT throw:
    // it runs inside the prompt try/catch, so an uncaught error is classified as client_error and silently
    // degrades the session to the relay posture — catch label-read failures internally and fall back to ids.
    promptMessage: () => Promise<string> | string;
    schemaTitle: string;
    schemaDescription: string;
    // Copy slots for the shared non-accept results: a NON_ACCEPT_PHRASES entry + " " + operationNoun forms
    // the first clause (e.g. "the user DECLINED the approval prompt for this" + "page deletion").
    operationNoun: string;
    nothingHappened: string;
    confirmTool: string;
    prepareTool: string;
    notConfirmedCode: string;
    // Invalidates the one-time confirmation after MCP_MAX_ELICITATIONS non-accepts (best-effort token consumption
    // plus any session-entry cleanup); a failure here is swallowed — the token may already have expired.
    invalidate: () => Promise<unknown>;
  }

  interface ElicitationExtra {
    _meta?: { progressToken?: string | number };
    sendNotification: (notification: {
      method: "notifications/progress";
      params: { progressToken: string | number; progress: number };
    }) => Promise<void>;
  }

  type ElicitationNonAcceptReason =
    | "declined"
    | "cancelled"
    | "timeout"
    | "accepted_without_confirm"
    | "client_error";

  type ElicitationPromptOutcome =
    | { kind: "accept" }
    | {
        kind: "non_accept";
        reason: ElicitationNonAcceptReason;
        detail?: string;
      };

  // Agent-facing first clause of the non-accept error, per outcome. Only the first three describe a human
  // answer; the last two are client behavior and must NOT read as a user decision — a claude.ai-class client
  // that declares elicitation without rendering it otherwise walks the agent into telling the user "you
  // declined" about a prompt they never saw. GRAMMAR CONTRACT: every phrase must end so that appending
  // " " + operationNoun still parses (hence the trailing "for this"). Note the classified reason is
  // client-influenceable (a hostile client can pick any outcome). It never feeds approval — but client_error
  // DOES refund the prompt charges and degrade the session to the relay posture [SECURITY: milestone-A
  // reviewed — equivalent power to simply not declaring the elicitation capability, so not a new bypass].
  const NON_ACCEPT_PHRASES: Record<ElicitationNonAcceptReason, string> = {
    declined: "the user DECLINED the approval prompt for this",
    cancelled: "the user cancelled the approval prompt for this",
    timeout: "the user did not answer the approval prompt in time for this",
    accepted_without_confirm:
      "the MCP client accepted the approval prompt WITHOUT the required confirm flag (not treatable as approval) for this",
    client_error:
      "the MCP client failed to deliver or answer the approval prompt (a client-side error — the user never saw or answered it) for this",
  };

  // Sends one elicitation prompt and returns whether the human EXPLICITLY accepted. Decline, cancel, timeout,
  // a transport error, or an accept without confirm=true all count as non-accept — never approval. Elicitation
  // is UX, not a security control [COUNCIL: security F8]: no server rule relaxes around it. Non-accepts carry
  // WHICH outcome occurred: a client that declares elicitation but never renders the dialog (auto-decline,
  // protocol error, silent timeout) must be distinguishable from a real human decline, both for the agent's
  // next step and for diagnosing broken clients from the tool result alone.
  async function sendElicitationPrompt(
    spec: DestructiveElicitation,
    extra: ElicitationExtra,
  ): Promise<ElicitationPromptOutcome> {
    // Progress notifications during the wait (when the CALLER requested them via a progressToken), so clients
    // that reset their tool-call timeout on progress don't abort while the human deliberates.
    const progressToken = extra._meta?.progressToken;
    let progress = 0;
    const progressTimer =
      progressToken !== undefined
        ? setInterval(() => {
            progress += 1;
            void extra
              .sendNotification({
                method: "notifications/progress",
                params: { progressToken, progress },
              })
              .catch(() => {});
          }, elicitationProgressInterval)
        : undefined;

    progressTimer?.unref?.();

    try {
      const answer = await server.server.elicitInput(
        {
          // The trailing sentence is the consent frame [SECURITY: milestone-A condition]: accepting the
          // prompt approves even when the optional boolean is left unset, so the copy must say exactly that —
          // otherwise a form-rendering client's unchecked box reads as "no" while the server reads approval.
          message: `${await spec.promptMessage()} Accepting this prompt APPROVES the ${spec.operationNoun}; decline or cancel to refuse.`,
          requestedSchema: {
            type: "object",
            properties: {
              confirm: {
                type: "boolean",
                title: spec.schemaTitle,
                // Same consent frame as the message: leaving the optional box unset does NOT withhold
                // approval — only an explicit false (or decline/cancel) refuses.
                description: `${spec.schemaDescription} Accepting approves even if this is left unset; set it to false or decline to refuse.`,
              },
            },
            // confirm is deliberately OPTIONAL: clients that render elicitation as bare accept/decline
            // buttons (no form) answer accept without content, and that explicit accept must count.
          },
        },
        { timeout: elicitationTimeout },
      );

      if (answer.action === "accept") {
        // An explicit accept IS explicit human intent, even from client UIs that render plain
        // accept/decline buttons and never return the optional boolean — only an explicit
        // confirm=false (accepted the form with the box answered "no") blocks it
        // [SECURITY: policy change reviewed — accept-without-boolean counts as approval].
        return answer.content?.confirm !== false
          ? { kind: "accept" }
          : { kind: "non_accept", reason: "declined" };
      }

      return {
        kind: "non_accept",
        reason: answer.action === "cancel" ? "cancelled" : "declined",
      };
    } catch (error) {
      // elicitInput timeout (McpError RequestTimeout) or a client/transport failure: never approval. The
      // detail (truncated, agent-facing) is what lets a broken client be diagnosed from the tool result.
      if (error instanceof McpError) {
        if (error.code === ErrorCode.RequestTimeout) {
          return { kind: "non_accept", reason: "timeout" };
        }

        // The SDK validates an accept's content against requestedSchema and throws InvalidParams when the
        // optional confirm field is present with the wrong type — a malformed accept, never approval.
        if (
          error.code === ErrorCode.InvalidParams &&
          error.message.includes(
            "Elicitation response content does not match requested schema",
          )
        ) {
          return { kind: "non_accept", reason: "accepted_without_confirm" };
        }
      }

      // The detail text is CLIENT-CONTROLLED and agent-facing: flatten control characters (so it cannot
      // format-break the result or smuggle terminal escapes) and frame it as untrusted before echoing it.
      const raw = error instanceof Error ? error.message : String(error);

      return {
        kind: "non_accept",
        reason: "client_error",
        detail: `client-reported (untrusted): ${raw
          // eslint-disable-next-line no-control-regex
          .replace(/[\u0000-\u001f\u007f]+/g, " ")
          .slice(0, 300)}`,
      };
    } finally {
      if (progressTimer !== undefined) clearInterval(progressTimer);
    }
  }

  // The shared approval step. Call it AFTER every refusal gate (branch gate, git refusals, revision/digest checks)
  // and BEFORE consuming the one-time confirmation: approved=true means "consume the token and execute now";
  // approved=false carries the exact refusal result and leaves the token intact and consumable later — except after
  // MCP_MAX_ELICITATIONS non-accepts, when invalidate() kills it (confirmation_exhausted). prompted=false means the
  // client does not declare elicitation: the documented fallback posture (the prepare relay text + the one-time
  // token); no server rule relaxes either way.
  async function elicitDestructiveApproval(
    spec: DestructiveElicitation,
    extra: ElicitationExtra,
  ): Promise<
    | { approved: true; prompted: boolean }
    | { approved: false; result: ToolResult }
  > {
    // Operator strict mode: an in-band prompt is REQUIRED. A client that cannot receive one is refused — the
    // relay posture is never available. Checked FIRST so a contradictory disabled+strict config fails safe to
    // the stricter posture.
    if (elicitationStrict === true) {
      if (server.server.getClientCapabilities()?.elicitation === undefined) {
        return {
          approved: false,
          result: result({
            error: `STRICT elicitation is enforced on this instance (APPSMITH_MCP_STRICT_ELICITATION): this MCP client does not support approval prompts, so this ${spec.operationNoun} was refused and ${spec.nothingHappened}. The user must connect with an elicitation-capable client, or the operator must relax strict mode.`,
            code: "elicitation_required",
          }),
        };
      }

      // Resource cap: repeated refunded client errors prove the client cannot deliver prompts — stop
      // attempting (each attempt costs a governance peek + an elicitInput round-trip + telemetry).
      if (strictClientErrorCount >= MCP_STRICT_MAX_CLIENT_ERRORS) {
        return {
          approved: false,
          result: result({
            error: `STRICT elicitation is enforced and this client failed to deliver ${MCP_STRICT_MAX_CLIENT_ERRORS} approval prompts (client errors), so further prompt attempts are refused for this session and ${spec.nothingHappened}. The user must connect with a working elicitation-capable client, or the operator must relax strict mode.`,
            code: "elicitation_required",
          }),
        };
      }
      // Capable client: fall through to normal prompting (client_error below will NOT degrade the session).
    } else if (elicitationDisabled === true || elicitationFallback) {
      // Operator escape hatch, and the session-local broken-client fallback: both force the documented relay
      // posture (the agent shows the prepare relay text and gets approval) instead of prompting. Set for the
      // session after a client_error outcome — a client that declares elicitation but cannot deliver the
      // dialog must not turn every destructive confirm into a dead end.
      return { approved: true, prompted: false };
    } else if (
      server.server.getClientCapabilities()?.elicitation === undefined
    ) {
      // Capability read LAZILY per session (ServerContext is built before connect(), so initialize-time
      // capture is impossible). When the client does NOT declare elicitation the prompt is skipped entirely.
      return { approved: true, prompted: false };
    }

    const now = Date.now();

    for (const [id, entry] of elicitationAttempts) {
      if (entry.expiresAt <= now) elicitationAttempts.delete(id);
    }

    const attempts = elicitationAttempts.get(spec.confirmationId) ?? {
      count: 0,
      expiresAt: now + ELICITATION_ATTEMPTS_TTL_MS,
    };

    // A dead confirmation (already consumed, or invalidated by exhaustion) refuses WITHOUT prompting the human
    // again — the prompt fires before token consumption, so this session-local check is what keeps a dead token
    // from generating further prompts.
    if (attempts.spent === true) {
      return {
        approved: false,
        result: result({
          error: `this confirmation was already used; call ${spec.prepareTool} again`,
          code: "confirmation_invalid",
        }),
      };
    }

    if (attempts.count >= MCP_MAX_ELICITATIONS) {
      return {
        approved: false,
        result: result({
          error: `this confirmation was invalidated after ${MCP_MAX_ELICITATIONS} unapproved prompts; call ${spec.prepareTool} again only if the user explicitly asks`,
          code: "confirmation_invalid",
        }),
      };
    }

    // Session-total budget: beyond it, REFUSE instead of prompting (never a silent fall-through to execution —
    // that would weaken the approval posture, not the prompting). The token is left intact; only prompting stops.
    if (sessionElicitationCount >= MCP_SESSION_MAX_ELICITATIONS) {
      return {
        approved: false,
        result: result({
          error: `this session has reached its budget of ${MCP_SESSION_MAX_ELICITATIONS} destructive-approval prompts, so this ${spec.operationNoun} was refused and ${spec.nothingHappened}. Stop asking — the user must perform the operation themselves or start a NEW MCP session.`,
          code: "elicitation_budget_exhausted",
        }),
      };
    }

    // Pre-prompt ownership peek [SECURITY F1]: verify the confirmation EXISTS in the governance store and was
    // prepared by THIS actor before the human sees any prompt. Without it, a fabricated/expired/foreign
    // confirmationId (no entry in the session-local elicitationAttempts map) raised a genuine-looking destructive
    // dialog — a prompt-spoofing / approval-fatigue primitive (execution still failed at consume time). The peek is
    // NON-consuming and checks existence + actor binding only; the full digest/operation/revision match stays at
    // consume time. The refusal happens BEFORE the counters above are incremented, so a forged id can never burn
    // the per-confirmation attempts or the session prompt budget [SECURITY F2]. `governance` (the ServerContext
    // coordinator) is always defined here in practice — every destructive confirm tool is registered only under
    // governance — so the undefined guard exists for type-safety and preserves the prior posture if ever reached.
    if (
      governance !== undefined &&
      !(await governance.confirmationBelongsTo(spec.confirmationId, actorId))
    ) {
      return {
        approved: false,
        result: result({
          error: `this confirmation is missing, expired, or was not prepared by you; call ${spec.prepareTool} again`,
          code: "confirmation_invalid",
        }),
      };
    }

    sessionElicitationCount += 1;
    attempts.count += 1;
    elicitationAttempts.set(spec.confirmationId, attempts);

    const answer = await sendElicitationPrompt(spec, extra);

    logElicitationOutcome(
      spec.confirmTool,
      answer.kind === "accept" ? "accept" : answer.reason,
    );

    if (answer.kind === "accept") return { approved: true, prompted: true };

    // A client_error is the CLIENT failing to deliver or answer the prompt — the human never took part. Refund
    // the charges (they exist to bound prompt fatigue, and no prompt reached the human), degrade the session to
    // the relay posture so the next confirm proceeds under the documented fallback, and teach the agent that
    // flow instead of a dead-end retry loop.
    if (answer.reason === "client_error") {
      sessionElicitationCount -= 1;
      attempts.count -= 1;
      elicitationAttempts.set(spec.confirmationId, attempts);

      // Strict mode never degrades: the refund still applies (no human took part), but the session keeps
      // requiring a successful in-band prompt — bounded by the strict client-error cap above.
      if (elicitationStrict === true) {
        strictClientErrorCount += 1;

        return {
          approved: false,
          result: result({
            error: `${NON_ACCEPT_PHRASES.client_error} ${spec.operationNoun}; ${spec.nothingHappened}. STRICT elicitation is enforced on this instance (APPSMITH_MCP_STRICT_ELICITATION), so the relay posture is unavailable: retrying will prompt again, and if this client cannot render prompts the user must switch clients or the operator must relax strict mode.`,
            code: spec.notConfirmedCode,
            reason: answer.reason,
            ...(answer.detail !== undefined && { detail: answer.detail }),
            attemptsRemaining: MCP_MAX_ELICITATIONS - attempts.count,
          }),
        };
      }

      elicitationFallback = true;
      logSink(
        `Appsmith MCP elicitation falling back to relay posture for this session (client_error on ${spec.confirmTool})\n`,
      );

      return {
        approved: false,
        result: result({
          error: `${NON_ACCEPT_PHRASES.client_error} ${spec.operationNoun}; ${spec.nothingHappened}. The confirmation is still valid. This client cannot render approval prompts, so the session now uses the relay posture: show the user the ${spec.prepareTool} relay text, get their EXPLICIT approval, then call ${spec.confirmTool} again — it will proceed without a prompt.`,
          code: spec.notConfirmedCode,
          reason: answer.reason,
          ...(answer.detail !== undefined && { detail: answer.detail }),
          attemptsRemaining: MCP_MAX_ELICITATIONS - attempts.count,
        }),
      };
    }

    // Non-accept never consumes the token — but re-prompting is bounded [SECURITY REV-2 CONDITION 2]. The
    // attempts entry is KEPT (until its TTL sweep) so later calls with the dead token refuse without prompting.
    if (attempts.count >= MCP_MAX_ELICITATIONS) {
      try {
        // Invalidate the one-time token by consuming it (best-effort; it may already have expired).
        await spec.invalidate();
      } catch {
        // Already gone/expired — invalidation achieved either way.
      }

      return {
        approved: false,
        result: result({
          error: `this ${spec.operationNoun} was not approved after ${MCP_MAX_ELICITATIONS} prompts (last outcome: ${answer.reason}); the confirmation has been invalidated and ${spec.nothingHappened}. Stop — only call ${spec.prepareTool} again if the user explicitly asks.`,
          code: "confirmation_exhausted",
          reason: answer.reason,
          ...(answer.detail !== undefined && { detail: answer.detail }),
        }),
      };
    }

    return {
      approved: false,
      result: result({
        error: `${NON_ACCEPT_PHRASES[answer.reason]} ${spec.operationNoun}; ${spec.nothingHappened}. The confirmation is still valid — call ${spec.confirmTool} again only after the user approves.`,
        code: spec.notConfirmedCode,
        reason: answer.reason,
        ...(answer.detail !== undefined && { detail: answer.detail }),
        attemptsRemaining: MCP_MAX_ELICITATIONS - attempts.count,
      }),
    };
  }

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
    branch: string | undefined;
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

    // Every layout edit lands in the app's EDIT copy only — the deployed (viewer) app keeps serving the last
    // publish until someone re-deploys. Agents reliably forget the publish-last instruction and report "done"
    // while the user stares at an unchanged app, so every mutating result states it explicitly, worded for the
    // agent to relay verbatim and matched to whether this deployment can re-publish via MCP at all.
    const deployNote = governance
      ? "Saved to the app's edit copy — the deployed app still shows the last publish. When you are done editing, re-deploy with prepare_publish -> confirm_publish (or tell the user to open the app in the Appsmith editor and click Deploy) so the changes go live."
      : "Saved to the app's edit copy — the deployed app still shows the last publish. Re-publishing via MCP requires governance (not configured on this deployment); tell the user to open the app in the Appsmith editor and click Deploy to see the changes live.";

    // M7-T1 branch gate + the advisory git warning, from ONE fail-closed read: the layout path piggybacks the
    // getApplication read the advisory warning (M1-T3) already required, so all layout-editing tools
    // (edit_page/patch_widgets/wire_event) inherit both without re-implementing the check. A read ERROR rejects
    // the mutation (fail closed); a successful read showing not-connected proceeds unchanged.
    const gate = await gitBranchGate(params.applicationId, params.branch);

    if (!gate.ok) return gate.result;

    const gitWarning = gate.gitWarning;

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

    // M6 delta overlap gate. commitLayout is the single write choke point for edit_page, patch_widgets, AND
    // wire_event, so the gate lives here once: a mutation whose final DSL contains an overlapping sibling pair
    // (keyed by name pair, initial-vs-final for multi-op patches) that the current DSL does not is rejected with
    // a ready-to-apply repair payload. Carried (pre-existing) overlaps never gate — messy pages stay editable —
    // and detached overlays (modals) are excluded. This also double-checks the move/resize repair logic itself.
    const overlapGate = overlapDelta(params.currentDsl, params.newDsl);

    if (overlapGate.introduced.length > 0) {
      const truncate = (name: string) =>
        name.length > 40 ? `${name.slice(0, 40)}…` : name;
      const shown = overlapGate.introduced
        .slice(0, 5)
        .map((pair) => `"${truncate(pair.a)}" + "${truncate(pair.b)}"`);
      const more = overlapGate.introduced.length - shown.length;
      const fix = suggestedFix(overlapGate.fixOperations);

      return result({
        error: `this change would introduce overlapping widgets: ${shown.join(", ")}${more > 0 ? ` (and ${more} more pair${more === 1 ? "" : "s"})` : ""}. Read the page (read_semantic_page) for current geometry and pick free positions, or apply the suggestedFix operations verbatim with patch_widgets.`,
        code: "overlap_introduced",
        pairs: overlapGate.introduced
          .slice(0, 20)
          .map((pair) => ({ a: truncate(pair.a), b: truncate(pair.b) })),
        ...(fix !== undefined ? { suggestedFix: fix } : {}),
      });
    }

    if (!governance) {
      const { diagnostics, layout } = await write();

      return result({
        ...params.extra,
        ...(gitWarning ? { gitWarning } : {}),
        deployNote,
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
        organizationId,
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
        deployNote,
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

  // M7-T1 — always-on git status read. A whitelist projection only: connection, branches, clean/dirty with
  // modified-entity counts, protected branches, remote HOST. gitAuth/keys/the full remote URL are never forwarded.
  server.tool(
    "read_git_status",
    "Read a SAFE projection of an application's git state: connected, current branch, default branch, protected branches, clean/dirty with modified-entity counts, and the remote HOST only (never keys, credentials, or the full remote URL). Mutations on a git-connected app require a `branch` parameter equal to the app's current branch — call this first to learn it. Set compareRemote: true (default false) to also fetch aheadCount/behindCount from the remote (slower; contacts the remote). If the status shows uncommitted changes you did not make, tell the user before editing further; prefer working on your own mcp/ branch via create_branch.",
    {
      applicationId: idSchema,
      compareRemote: z.boolean().optional(),
    },
    async ({ applicationId, compareRemote }) => {
      let meta: GitMetadataProjection;

      try {
        meta = gitMetadataOf(await api.getApplication(applicationId));
      } catch {
        return result({
          error: "could not read the application's git state; retry",
          code: "git_state_unknown",
        });
      }

      // A successful metadata read is exactly what the branch gate needs — seed its cache so the follow-up
      // mutation does not repeat the read (the cache applies its own binding rules; errors above are never cached).
      gitGateCache.set(applicationId, meta);

      if (!meta.connected) {
        return result({
          git: { connected: false },
          note: "This application is not connected to git; mutations do not need the branch parameter.",
        });
      }

      const withRemote = compareRemote === true;

      try {
        const [status, protectedBranches] = await Promise.all([
          // compareRemote is ALWAYS explicit: the SERVER defaults it to true (remote fetch), the MCP defaults to false.
          api.getGitStatus(applicationId, withRemote),
          meta.baseApplicationId !== undefined
            ? api.getGitProtectedBranches(meta.baseApplicationId)
            : Promise.resolve(undefined),
        ]);
        const projectedStatus = projectGitStatus(status, withRemote);
        const behindCount = projectedStatus.behindCount;

        return result({
          git: {
            connected: true,
            ...(meta.branchName !== undefined
              ? { branchName: meta.branchName }
              : {}),
            ...(meta.defaultBranchName !== undefined
              ? { defaultBranchName: meta.defaultBranchName }
              : {}),
            ...(meta.remoteHost !== undefined
              ? { remoteHost: meta.remoteHost }
              : {}),
            ...projectedStatus,
            protectedBranches: Array.isArray(protectedBranches)
              ? protectedBranches.filter(
                  (name): name is string => typeof name === "string",
                )
              : [],
          },
          // Behind-remote teaching: MCP has no pull, so the human resolves it in Appsmith first.
          ...(typeof behindCount === "number" && behindCount > 0
            ? {
                note: `This branch is ${behindCount} commit(s) behind its remote. Suggest the user pulls the latest changes in Appsmith's git UI before further edits (MCP cannot pull).`,
              }
            : {}),
        });
      } catch {
        return result({
          error: "could not read the application's git status; retry",
          code: "git_status_unavailable",
        });
      }
    },
  );

  // Note surfaced by get_capabilities so an agent learns the git policy before it starts editing.
  const GIT_POLICY_NOTE =
    "Git-connected applications: every mutation REQUIRES a 'branch' parameter equal to the target app's current branch — call read_git_status first (a missing/mismatched value fails with the current branch in the error). Edits are saved as UNCOMMITTED changes on that branch (commit them via Appsmith's git UI), and publishing from MCP is disabled for git apps. Prefer creating an agent branch with create_branch (reserved mcp/ namespace; PUSHES the new ref to the remote) and editing the NEW applicationId it returns.";

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
        // Build identity (also on /health) so "which build is this instance running" is answerable from either side.
        build: MCP_BUILD_INFO,
        gitPolicy: GIT_POLICY_NOTE,
      }),
  );

  // Always-on tool mirror of the instruction resources: tools-only MCP clients (e.g. ChatGPT) cannot read MCP
  // resources, so the guides/recipes/reference would otherwise be invisible to them. Same InstructionDoc registry
  // as registerInstructions — no forked content; the slug list in the description is generated, so it cannot drift.
  server.tool(
    "get_guide",
    `Read a built-in guide, recipe, or reference document as rendered markdown by slug — the same content exposed as the appsmith:// MCP resources, for clients that cannot read resources. Valid slugs: ${INSTRUCTION_DOCS.map(
      (doc) => doc.slug,
    ).join(", ")}.`,
    { slug: z.string().trim().min(1).max(64) },
    async ({ slug }) => {
      const doc = getInstructionDoc(slug);

      if (!doc) {
        return result({
          error: `unknown guide "${slug}"`,
          available: INSTRUCTION_DOCS.map((entry) => entry.slug),
        });
      }

      return result({
        slug: doc.slug,
        title: doc.title,
        markdown: doc.render(),
      });
    },
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
    "Create an Appsmith application from a high-level app spec. Widgets are auto-placed on the grid, compiled to an artifact, and imported via the caller's ACL-enforced permissions. The new app is automatically deployed (published) on creation, and the response includes an editorUrl plus a viewerUrl for the default page when available — treat that first deployed copy as a scaffold and re-publish after wiring data and events. The default page in the returned pages[] carries its layoutId; pass that pageId + layoutId to read_semantic_page / patch_widgets / edit_page / wire_event to author it (for other pages, get layoutId from read_pages). workspaceId is required — if the user names a workspace, resolve it to its id with resolve_workspace (or list_workspaces) rather than asking for a raw id.",
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
      const { applicationId, applicationSlug, pages } =
        projectImportedApplication(imported);
      // Fallback URLs from the import response (its pages lack slugs, so slug-backed URLs are usually omitted here);
      // overridden below with the pages DTO — whose pages DO carry slugs — as soon as we read it (F2).
      let urls = applicationUrls(requestOrigin, applicationSlug, pages);
      // The default page's layoutId, surfaced so the authoring tools are usable straight after a build (F3).
      let layoutId: string | undefined;
      const warnings: string[] = [];

      // AUTO-PUBLISH the just-created app (M5-T3). No confirmation token is needed here — this app was created by
      // THIS call, so it has no existing deployed state a deploy could clobber; the governed
      // prepare_publish/confirm_publish flow (and its git-connected refusal) remains required for RE-publishing
      // existing apps, including this one after later edits. A publish failure must never fail the create: it
      // degrades to a "created but not deployed" warning carrying only a coarse class, never the raw error.
      if (applicationId === undefined) {
        warnings.push(
          "created but not deployed: application id missing from the import response",
        );
      } else if (governance) {
        // Governance present: record the deploy through gov.execute like confirm_publish does, so the audit
        // trail shows who deployed what. The just-read page-list revision is passed as both expected and current
        // (nothing can be stale for an app that did not exist a moment ago).
        try {
          // Reuse this EXISTING pages read (previously only fingerprinted) to also source slug-backed URLs (F2) and
          // the default page's layoutId (F3) — no extra call on the governed branch.
          const pagesResponse = await api.getApplicationPages(applicationId);
          const currentRevision = fingerprintPages(pagesResponse);

          urls = applicationUrlsFromPages(requestOrigin, pagesResponse);
          layoutId = await defaultPageLayoutId(api, pagesResponse);

          await governance.execute({
            actorId,
            organizationId,
            entityKey: `application:${applicationId}`,
            operation: "auto_publish",
            expectedRevision: currentRevision,
            currentRevision,
            mutate: async () => {
              await api.publishApplication(applicationId);

              return {
                value: {},
                revisionAfter: currentRevision,
                rollback: {},
                summary: { applicationId, trigger: "build_application" },
              };
            },
          });
        } catch (error) {
          const statusClass = publishFailureClass(error);

          // A failed governed deploy leaves no gov change record (nothing was executed), so emit the same
          // structured event the ungoverned path does — failure-rate telemetry stays symmetric across postures.
          logMcpEvent("appsmith_mcp_auto_publish", {
            usernameHash: hashUsername(actorId),
            statusClass,
          });
          warnings.push(`created but not deployed: ${statusClass}`);
        }
      } else {
        // Ungoverned deployments have no change records, so the deploy must still never be silent: emit the
        // M4-T4-style structured event (hashed actor, coarse outcome class — no ids, tokens, or error bodies)
        // on success AND failure so the auto-publish success vs warning rate stays measurable.
        try {
          await api.publishApplication(applicationId);
          logMcpEvent("appsmith_mcp_auto_publish", {
            usernameHash: hashUsername(actorId),
            statusClass: "success",
          });
        } catch (error) {
          const statusClass = publishFailureClass(error);

          logMcpEvent("appsmith_mcp_auto_publish", {
            usernameHash: hashUsername(actorId),
            statusClass,
          });
          warnings.push(`created but not deployed: ${statusClass}`);
        }

        // Extra pages read on the ungoverned branch ONLY (the governed branch reuses its fingerprint read) to source
        // slug-backed URLs (F2) and the default page's layoutId (F3). A separate try so a publish failure above does
        // not skip URL/layoutId enrichment, and a read failure here does not add a spurious "not deployed" warning.
        try {
          const pagesResponse = await api.getApplicationPages(applicationId);

          urls = applicationUrlsFromPages(requestOrigin, pagesResponse);
          layoutId = await defaultPageLayoutId(api, pagesResponse);
        } catch {
          // URLs/layoutId are additive; omit on failure.
        }
      }

      // Attach the default page's layoutId to that page in the result (the authoring tools need it as input).
      const flaggedDefaultIndex = pages.findIndex(
        (page) => page.isDefault === true,
      );
      const defaultPageIndex =
        flaggedDefaultIndex >= 0
          ? flaggedDefaultIndex
          : pages.length > 0
            ? 0
            : -1;
      const resultPages =
        layoutId !== undefined && defaultPageIndex >= 0
          ? pages.map((page, index) =>
              index === defaultPageIndex ? { ...page, layoutId } : page,
            )
          : pages;

      return result({
        application: imported,
        ...(applicationId !== undefined ? { applicationId } : {}),
        pages: resultPages,
        ...urls,
        ...(warnings.length > 0 ? { warnings } : {}),
        diagnostics,
      });
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
      branch: gitBranchParamSchema.optional(),
      edit: z.record(z.unknown()),
    },
    async ({ applicationId, branch, edit, layoutId, pageId, revision }) => {
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
        branch,
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
    "Directly update, move, resize, reparent, or remove widgets using a strict typed patch. Read the page with read_semantic_page first and pass its revision. Only allowlisted literal properties can change; removing a widget with children is rejected. Moves are occupancy-aware: a position that lands on another widget is repaired to the nearest free spot below (reported as requestedPosition vs position plus a note) unless the operation sets strict: true, which rejects with the colliding names and the nearest free position; reparenting always lands at the nearest free spot in the new canvas. Resize ({ kind: 'resize', name, rows?, columns?, strict? }, grid units) grows/shrinks a widget: growth pushes overlapping siblings down, width cannot exceed the canvas, containers cannot shrink below their children, and modal rows translate to the modal's pixel height. Table styling: set literal 'oddRowColor'/'evenRowColor' for alternating (zebra) row backgrounds. Re-bind a table with structured 'tableData' { query, field?, clearWhenEmpty? } — clearWhenEmpty names an input whose emptiness clears the table (so a Clear button that resets that input also empties the table; resetWidget alone cannot clear a query-bound table). Input validation: set 'validation' { format: 'zipcode'|'email'|'number'|'integer'|'usPhone', message? } on an input to add a vetted regex + error message (never author a raw regex). Set 'disableWhenInvalid': '<input>' on a button to grey it out until that input passes validation (compiles to {{ !<input>.isValid }}) — use with validation so a bad value can't run the query. Conditional visibility / view switching: set 'visibleWhen' { control: '<select|tabs widget>', equals: '<value>' } to show a widget only when the control has that value — e.g. show a table when a ViewToggle equals 'Table' and a detail panel when it equals 'Details', switching views with one control. Two more predicate forms: { rowSelected: '<table>' } shows the widget only while that table has a selected row (detail panels, edit buttons), and { notEmpty: '<input>' } only while that input holds text.",
    {
      applicationId: idSchema,
      pageId: idSchema,
      layoutId: idSchema,
      revision: z.string().regex(/^[a-f0-9]{64}$/),
      branch: gitBranchParamSchema.optional(),
      // The real structured schema, exposed so MCP clients can introspect the patch vocabulary instead of
      // guessing from prose. The handler re-parses below, which also keeps the rich issue-path errors.
      patch: widgetPatchSchema,
    },
    async ({ applicationId, branch, layoutId, pageId, patch, revision }) => {
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
        branch,
        operation: "patch_widgets",
        newDsl: patched.dsl,
        extra: {
          changes: patched.changes,
          // Collision repairs, cascade pushes, and modal-scroll warnings — surfaced top-level because agents
          // skim `changes` but read notes.
          ...(patched.notes.length > 0 ? { notes: patched.notes } : {}),
        },
      });
    },
  );

  server.tool(
    "wire_event",
    "Wire a widget event to a safe action from a CLOSED vocabulary: run a query, navigate to a page, show/close a modal, show an alert, reset one or more widgets ({ reset: 'Widget' } or { reset: ['A','B'] } — e.g. a Clear button that empties an input and resets a table), append a query's rows to a store key ({ appendToStore: { key, query, field?, fields? } } — an accumulating results table; bind the table with a { store: '<key>' } source/tableData; session-only), or empty one store key ({ clearStoreKey: { key } }). A run action may chain onSuccess/onError follow-ups from the same vocabulary (e.g. submit -> run insert -> re-run the table's query -> close the modal -> alert). The action may also be an ordered LIST of 2-5 statements with at most one run (e.g. clearStoreKey + reset in one click). Supported events: button onClick, table onRowSelected, modal onClose, tabs onTabSelected, select onOptionChange, input onSubmit, checkbox onCheckChange, switch onChange, datepicker onDateSelected. Queries bound to widgets already run on page load automatically (the server derives on-page-load execution from bindings) — no event needed for that. Modal stacking is policed: opening a modal from inside another modal warns at depth 2 and is rejected at depth 3+ or on a cycle; close the host modal in the same action (closeModal + showModal) for a wizard-style transition that never stacks. Read the page first and pass its revision. The compiler emits the binding; no raw JS or bindings are accepted.",
    {
      applicationId: idSchema,
      pageId: idSchema,
      layoutId: idSchema,
      revision: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
      branch: gitBranchParamSchema.optional(),
      // The real structured schema (closed action vocabulary), exposed for client introspection; the handler
      // re-parses below for the rich issue-path errors.
      spec: wireEventSpecSchema,
    },
    async ({ applicationId, branch, layoutId, pageId, revision, spec }) => {
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

      // M6 modal discipline: evaluate the modal-open graph BEFORE writing. Close-aware — an action that also
      // closes its host modal is a transition (wizards / back-navigation), not stacking. The new edge comes from
      // the PARSED action (structural walk), so no emitted form can evade it; pre-existing DSL bindings are
      // text-scanned fail-open (excluded bindings are surfaced by inspect_page).
      const modalVerdict = evaluateModalWiring({
        dsl: currentDsl,
        widgetName: parsed.data.widget,
        event: parsed.data.event,
        action: parsed.data.action,
      });

      if (modalVerdict.error !== undefined) {
        return result({ error: modalVerdict.error, code: "modal_stack" });
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
        branch,
        operation: "wire_event",
        newDsl,
        extra: {
          widget: parsed.data.widget,
          event: parsed.data.event,
          ...(modalVerdict.warning !== undefined
            ? { modalWarning: modalVerdict.warning }
            : {}),
          // M5 telemetry: the statement verb kinds this wiring uses, so appendToStore/clearStoreKey adoption is
          // measurable from the audit/changes payload.
          actionKinds: eventActionKinds(parsed.data.action),
        },
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
    "List an application's pages (safe metadata: id, name, slug, visibility, layoutId) plus a revision token for create_page / rename_page / delete_page. The per-page layoutId is what read_semantic_page / patch_widgets / edit_page / wire_event require as input. Never returns DSL, actions, or bindings.",
    { applicationId: idSchema },
    async ({ applicationId }) => {
      const pages = await api.getApplicationPages(applicationId);
      const projected = projectPages(pages);
      // Per-page layoutId requires a single-page fetch each (the pages-LIST DTO omits layouts), so this is N+1 in the
      // page count — acceptable because pages per app are few, and layoutId is required by every authoring tool. The
      // fan-out is bounded (below) so a many-page app degrades to a few sequential waves rather than an N-wide burst.
      const withLayouts = await mapWithConcurrency(
        projected,
        READ_PAGES_LAYOUT_CONCURRENCY,
        async (page) => {
          try {
            const layoutId = layoutIdOf(await api.getPage(page.id));

            return layoutId !== undefined ? { ...page, layoutId } : page;
          } catch {
            return page;
          }
        },
      );

      return result({
        pages: withLayouts,
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

    // Every governance AUDIT READ must be tenant-scoped. When the caller's organization is unknown (an older
    // server that does not report organizationId, or any edition that does not populate it) we cannot bound the
    // read to one tenant, so we refuse rather than run a query with the empty-org sentinel — which would let two
    // tenants alias on "" and read each other's records. Returns a ready refusal, or undefined to proceed.
    // (Governed WRITES are unaffected: they stamp whatever org the session has; a record stamped "" is simply
    // invisible to every org-scoped read, which is the fail-closed direction.)
    const organizationScopeRefusal = (tool: string): ToolResult | undefined =>
      organizationId
        ? undefined
        : result({
            error: `${tool} is unavailable: the caller's organization could not be determined, so the audit read cannot be scoped to your tenant.`,
            code: "organization_scope_unavailable",
          });

    server.tool(
      "update_theme",
      "Update the application's theme tokens (primaryColor, borderRadius, fontFamily only) using a revision from read_theme. Stylesheets, CSS, URLs, and bindings are never accepted. Returns the new tokens, revision, and change id.",
      {
        applicationId: idSchema,
        revision: z.string().regex(/^[a-f0-9]{64}$/),
        branch: gitBranchParamSchema.optional(),
        patch: z.record(z.unknown()),
      },
      async ({ applicationId, branch, patch, revision }) => {
        const parsed = themePatchSchema.safeParse(patch);

        if (!parsed.success) return validationError(parsed.error.issues);

        const gate = await gitBranchGate(applicationId, branch);

        if (!gate.ok) return gate.result;

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
            organizationId,
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
      async ({ limit }) => {
        const refusal = organizationScopeRefusal("list_changes");

        if (refusal) return refusal;

        return result({
          changes: (
            await gov.listChanges(actorId, organizationId, limit ?? 20)
          ).map((change) => projectChange(change)),
        });
      },
    );

    server.tool(
      "get_change",
      "Get a single MCP change record by id (audit metadata + semantic summary; the rollback snapshot is never exposed).",
      { changeId: idSchema },
      async ({ changeId }) => {
        const refusal = organizationScopeRefusal("get_change");

        if (refusal) return refusal;

        const change = await gov.getChange(changeId, actorId, organizationId);

        return change
          ? result({ change: projectChange(change) })
          : result({ error: "change not found" });
      },
    );

    server.tool(
      "list_all_changes",
      "ADMIN ONLY: list recent MCP governance change records across ALL actors in this instance (audit oversight), each attributed to its actor. Requires the caller to be an Appsmith instance administrator; a non-admin caller is refused. Returns safe change headers + semantic summaries — never rollback snapshots.",
      { limit: z.number().int().min(1).max(200).optional() },
      async ({ limit }) => {
        if (!isAdmin) {
          return result({
            error:
              "list_all_changes is restricted to Appsmith instance administrators; use list_changes for your own change history.",
            code: "admin_required",
          });
        }

        // Cross-actor audit is scoped to the caller's organization: on a multi-org (EE) deployment isSuperUser is a
        // per-org signal, so an admin must never see other tenants' records (fail closed when org is unknown).
        const refusal = organizationScopeRefusal("list_all_changes");

        if (refusal) return refusal;

        return result({
          changes: (await gov.listAllChanges(organizationId, limit ?? 50)).map(
            (change) => projectChange(change, true),
          ),
        });
      },
    );

    server.tool(
      "get_any_change",
      "ADMIN ONLY: get a single MCP change record by id regardless of which actor made it (audit oversight), attributed to its actor. Requires an Appsmith instance administrator; a non-admin caller is refused. The rollback snapshot is never exposed.",
      { changeId: idSchema },
      async ({ changeId }) => {
        if (!isAdmin) {
          return result({
            error:
              "get_any_change is restricted to Appsmith instance administrators; use get_change for your own changes.",
            code: "admin_required",
          });
        }

        // Tenant-scoped like list_all_changes: refuse when the caller's org is unknown rather than reading across
        // tenants (see the note there).
        const refusal = organizationScopeRefusal("get_any_change");

        if (refusal) return refusal;

        const change = await gov.getAnyChange(changeId, organizationId);

        return change
          ? result({ change: projectChange(change, true) })
          : result({ error: "change not found" });
      },
    );

    server.tool(
      "get_change_diff",
      "Get the semantic before/after summary for a change (operation, revisions, summary).",
      { changeId: idSchema },
      async ({ changeId }) => {
        const refusal = organizationScopeRefusal("get_change_diff");

        if (refusal) return refusal;

        const change = await gov.getChange(changeId, actorId, organizationId);

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
      "Prepare to roll back a layout change (edit_page/patch_widgets). Returns a one-time confirmation token plus 'relay' text to show the user before confirming. Only offered when a safe layout snapshot exists.",
      { changeId: idSchema },
      async ({ changeId }) => {
        const refusal = organizationScopeRefusal("prepare_rollback");

        if (refusal) return refusal;

        const change = await gov.getChange(changeId, actorId, organizationId);

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
          // Relay text for clients WITHOUT elicitation support: shown to the human before confirming.
          relay: `Show the user this and get their approval BEFORE calling confirm_rollback: roll back change "${promptSafe(changeId)}" (${promptSafe(change.operation)} on ${promptSafe(change.entityKey)}) by re-applying the earlier layout snapshot, replacing the page's current layout. Do not call confirm_rollback without the user's explicit approval.`,
        });
      },
    );

    server.tool(
      "confirm_rollback",
      "Roll back a layout change using a confirmation token from prepare_rollback. Re-applies the prior layout snapshot only if the page is unchanged since the change. On a git-connected app, pass the app's current branch (from read_git_status). When the MCP client supports elicitation, the user is prompted for approval and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise show the user the prepare_rollback relay text and get their approval first.",
      {
        changeId: idSchema,
        confirmationId: idSchema,
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, changeId, confirmationId }, extra) => {
        const refusal = organizationScopeRefusal("confirm_rollback");

        if (refusal) return refusal;

        const change = await gov.getChange(changeId, actorId, organizationId);

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

        // M7 branch gate: a rollback re-applies a layout — a mutation like any other. Gated BEFORE the one-time
        // confirmation is consumed, so a refusal never burns the token. (The architect's M7 review found this
        // was the one mutating tool the gate missed.)
        const gate = await gitBranchGate(rollback.applicationId, branch);

        if (!gate.ok) return gate.result;

        // Elicitation AFTER every refusal gate and BEFORE token consumption: a declined prompt leaves the
        // one-time confirmation intact and consumable later.
        const approval = await elicitDestructiveApproval(
          {
            confirmationId,
            // Names the change being reverted; the snapshot is layout-granular, so the prompt claims only that
            // the page's current layout is replaced — never an itemized list of what changes back.
            promptMessage: () =>
              `Roll back change "${promptSafe(changeId)}" (${promptSafe(change.operation)} on ${promptSafe(change.entityKey)})? This re-applies the earlier layout snapshot, replacing that page's CURRENT layout.`,
            schemaTitle: "Approve layout rollback",
            schemaDescription:
              "Select true to re-apply the earlier layout snapshot, replacing the page's current layout.",
            operationNoun: "rollback",
            nothingHappened: "nothing was rolled back",
            confirmTool: "confirm_rollback",
            prepareTool: "prepare_rollback",
            notConfirmedCode: "rollback_not_confirmed",
            invalidate: async () =>
              gov.consumeDestructiveConfirmation({
                confirmationId,
                actorId,
                entityKey: change.entityKey,
                operation: "rollback",
                revision: change.revisionAfter,
                digest: operationDigest({ changeId }),
              }),
          },
          extra,
        );

        if (!approval.approved) return approval.result;

        try {
          await gov.consumeDestructiveConfirmation({
            confirmationId,
            actorId,
            entityKey: change.entityKey,
            operation: "rollback",
            revision: change.revisionAfter,
            digest: operationDigest({ changeId }),
          });
          markElicitationConsumed(confirmationId);

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
            organizationId,
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
      "Publishing (deploying) the application is high-impact. Returns a one-time confirmation token bound to the application and its current page-list revision, plus 'relay' text to show the user before confirming. Call confirm_publish with the token to deploy.",
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
          // Relay text for clients WITHOUT elicitation support: shown to the human before confirming.
          relay: `Show the user this and get their approval BEFORE calling confirm_publish: publish (deploy) the application "${promptSafe(applicationId)}" — its CURRENT state becomes what everyone who has access to the app sees. Do not call confirm_publish without the user's explicit approval.`,
        });
      },
    );

    server.tool(
      "confirm_publish",
      "Publish (deploy) the application using a confirmation token from prepare_publish. Token, actor, application, and revision must match, and the page-list revision must be unchanged since preparation. When the MCP client supports elicitation, the user is prompted for approval and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise show the user the prepare_publish relay text and get their approval first.",
      {
        applicationId: idSchema,
        revision: z.string().regex(/^[a-f0-9]{64}$/),
        confirmationId: idSchema,
      },
      async ({ applicationId, confirmationId, revision }, extra) => {
        try {
          // Refuse to deploy a git-connected app: publishing from MCP would ship whatever uncommitted state sits on the
          // branch, bypassing the git review/commit flow. Checked before consuming the confirmation so the token is not
          // spent on a refused publish. This is a HARD gate, so — unlike the advisory edit warning (fetchGitState,
          // fail-open) — it fails CLOSED: if the git state cannot be read, refuse rather than risk deploying
          // uncommitted git state.
          let git: GitState;
          let application: unknown;

          try {
            application = await api.getApplication(applicationId);
            git = gitStateOf(application);
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

          // Elicitation AFTER every refusal gate and BEFORE token consumption: a declined prompt leaves the
          // one-time confirmation intact and consumable later.
          const appName = (application as { name?: unknown } | null)?.name;
          const appLabel = truncateForPrompt(
            typeof appName === "string" && appName.length > 0
              ? appName
              : applicationId,
            40,
          );
          const approval = await elicitDestructiveApproval(
            {
              confirmationId,
              // Honest scope: publishing deploys the app's CURRENT state to everyone with access — the revision
              // is page-list-granular, so the prompt never itemizes what ships.
              promptMessage: () =>
                `Publish (deploy) "${promptSafe(appLabel)}"? This deploys the application's CURRENT state to everyone who has access to the app.`,
              schemaTitle: "Approve publish",
              schemaDescription:
                "Select true to deploy the application's current state to everyone who has access to it.",
              operationNoun: "publish",
              nothingHappened: "nothing was published",
              confirmTool: "confirm_publish",
              prepareTool: "prepare_publish",
              notConfirmedCode: "publish_not_confirmed",
              invalidate: async () =>
                gov.consumeDestructiveConfirmation({
                  confirmationId,
                  actorId,
                  entityKey: `application:${applicationId}`,
                  operation: "publish",
                  revision,
                  digest: operationDigest({ applicationId }),
                }),
            },
            extra,
          );

          if (!approval.approved) return approval.result;

          await gov.consumeDestructiveConfirmation({
            confirmationId,
            actorId,
            entityKey: `application:${applicationId}`,
            operation: "publish",
            revision,
            digest: operationDigest({ applicationId }),
          });
          markElicitationConsumed(confirmationId);

          const currentRevision = fingerprintPages(
            await api.getApplicationPages(applicationId),
          );
          const { changeId } = await gov.execute({
            actorId,
            organizationId,
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

    // M7-T2 — agent branches. Governance-gated like the other high-impact operations: creating a branch is remote
    // egress (create-ref PUSHES the new ref to the customer remote) and needs the gov audit trail.
    const MCP_BRANCH_PREFIX = "mcp/";
    const MCP_BRANCH_REMAINDER = /^[A-Za-z0-9_-]{1,60}$/;
    const MCP_BRANCH_CAP = 5;

    // Carries a ready ToolResult refusal out of gov.execute's mutate when the mutate-time refs re-read shows the
    // branch list changed between the pre-check and the locked mutate (cap overshoot / duplicate race).
    class BranchListRaceError extends Error {
      constructor(readonly refusal: ToolResult) {
        super("branch list changed between check and create");
        this.name = "BranchListRaceError";
      }
    }

    server.tool(
      "create_branch",
      "Create a NEW agent git branch on a git-connected application from its CURRENT (possibly uncommitted) state. The name MUST start with the reserved prefix 'mcp/' (remainder: 1-60 characters of A-Za-z0-9_-). IMPORTANT: this PUSHES the new ref to the customer's git remote immediately (deploy-key egress; remote CI/webhooks watching branch pushes will run). Appsmith models each branch as its OWN application and has no checkout: the result returns the NEW branched applicationId — ALL subsequent reads, edits, and events for this branch must target that id, passing branch: '<name>' (the human's editor view is untouched). At most 5 mcp/ branches per application; at the cap, reuse a branch you created earlier or ask the user to delete stale mcp/ branches in Appsmith's branch UI. If read_git_status shows uncommitted changes you did not make, surface that to the user BEFORE branching — they ride along onto the new branch. Governed.",
      {
        applicationId: idSchema,
        name: z.string().min(1).max(64),
      },
      async ({ applicationId, name }) => {
        // Byte-exact prefix check: no trim, no case folding, bare "mcp" rejected. mcp/* is the RESERVED agent
        // namespace — this server only ever creates branches inside it.
        if (!name.startsWith(MCP_BRANCH_PREFIX)) {
          return result({
            error: `branch name must start with the reserved agent prefix "${MCP_BRANCH_PREFIX}" (e.g. "mcp/fix-orders-table")`,
            code: "branch_name_invalid",
          });
        }

        const remainder = name.slice(MCP_BRANCH_PREFIX.length);

        if (!MCP_BRANCH_REMAINDER.test(remainder)) {
          return result({
            error: `the part after "${MCP_BRANCH_PREFIX}" must be 1-60 characters of A-Za-z0-9_-`,
            code: "branch_name_invalid",
          });
        }

        // Fail-closed git reads: the app must be VERIFIABLY git-connected before anything touches the remote.
        const read = await gateGitState(applicationId);

        if ("error" in read) return read.error;

        if (!read.state.connected) {
          return result({
            error:
              "this application is not connected to git; create_branch only applies to git-connected applications",
            code: "git_not_connected",
          });
        }

        // Branch cap + duplicate check from the server's branch list — fail closed: an unreadable list refuses
        // creation rather than risking unbounded refs on the customer remote.
        let branchNames: string[];

        try {
          branchNames = gitBranchNames(
            await api.listGitBranches(applicationId),
          );
        } catch {
          return result({
            error:
              "could not verify the application's existing branches; retry",
            code: "git_state_unknown",
          });
        }

        if (branchNames.includes(name)) {
          return result({
            error: `branch "${name}" already exists on this application; pick a new name, or continue on that branch's applicationId if you created it earlier`,
            code: "branch_exists",
          });
        }

        const mcpBranches = branchNames.filter((branchName) =>
          branchName.startsWith(MCP_BRANCH_PREFIX),
        );

        if (mcpBranches.length >= MCP_BRANCH_CAP) {
          return result({
            error: `this application already has ${mcpBranches.length} mcp/ branches (the limit is ${MCP_BRANCH_CAP}). Reuse a branch you created earlier in this session, or ask the user to delete stale mcp/ branches in Appsmith's branch UI, then retry.`,
            code: "mcp_branch_limit",
            mcpBranches,
          });
        }

        const revisionBefore = fingerprintBranchList(branchNames);

        try {
          const { changeId, value } = await gov.execute({
            actorId,
            organizationId,
            entityKey: `application:${applicationId}:branches`,
            operation: "create_branch",
            expectedRevision: revisionBefore,
            currentRevision: revisionBefore,
            mutate: async () => {
              // Re-read the refs list INSIDE the governed mutate (under the entity lock): concurrent creates can
              // all pass the pre-check above before any of them pushes a ref, so the cap/duplicate decision must
              // bind to the freshest list. The pre-check stays as the cheap fast-path error; this re-check is what
              // keeps the customer remote from ever overshooting the cap. Fail closed like the pre-check.
              let freshNames: string[];

              try {
                freshNames = gitBranchNames(
                  await api.listGitBranches(applicationId),
                );
              } catch {
                throw new BranchListRaceError(
                  result({
                    error:
                      "could not verify the application's existing branches; retry",
                    code: "git_state_unknown",
                  }),
                );
              }

              if (freshNames.includes(name)) {
                throw new BranchListRaceError(
                  result({
                    error: `branch "${name}" already exists on this application; pick a new name, or continue on that branch's applicationId if you created it earlier`,
                    code: "branch_exists",
                  }),
                );
              }

              const freshMcpBranches = freshNames.filter((branchName) =>
                branchName.startsWith(MCP_BRANCH_PREFIX),
              );

              if (freshMcpBranches.length >= MCP_BRANCH_CAP) {
                throw new BranchListRaceError(
                  result({
                    error: `this application already has ${freshMcpBranches.length} mcp/ branches (the limit is ${MCP_BRANCH_CAP}). Reuse a branch you created earlier in this session, or ask the user to delete stale mcp/ branches in Appsmith's branch UI, then retry.`,
                    code: "mcp_branch_limit",
                    mcpBranches: freshMcpBranches,
                  }),
                );
              }

              const created = await api.createGitBranch(applicationId, name);
              const projected = projectImportedApplication(created);

              return {
                value: projected,
                revisionAfter: fingerprintBranchList([...freshNames, name]),
                rollback: {},
                summary: {
                  sourceApplicationId: applicationId,
                  branchName: name,
                  ...(projected.applicationId !== undefined
                    ? { newApplicationId: projected.applicationId }
                    : {}),
                },
              };
            },
          });

          // Branch-scoped editor URL when the response carries usable slugs; omitted otherwise (never guessed).
          const urls = applicationUrls(
            requestOrigin,
            value.applicationSlug,
            value.pages,
          );
          const editorUrl =
            urls.editorUrl !== undefined
              ? `${urls.editorUrl}?branch=${encodeURIComponent(name)}`
              : undefined;

          return result({
            created: true,
            branchName: name,
            ...(value.applicationId !== undefined
              ? { applicationId: value.applicationId }
              : {}),
            ...(editorUrl !== undefined ? { editorUrl } : {}),
            // Ground truth (verified against the server): create-ref pushes. Stated in the result so the agent
            // relays it — branch creation is visible on the customer remote and can trigger CI.
            pushedToRemote: true,
            note: `The new branch was PUSHED to the git remote. There is no checkout: all further edits, reads, and commits for this branch must target the NEW applicationId${value.applicationId !== undefined ? ` ("${value.applicationId}")` : ""} with branch: "${name}". The original applicationId still points at its own branch.`,
            changeId,
          });
        } catch (error) {
          if (error instanceof BranchListRaceError) return error.refusal;

          return governanceError(error) ?? compileError(error);
        }
      },
    );

    // M7-T3 — governed commits on agent branches. GROUND TRUTH (verified against GitFSServiceCEImpl.commitArtifact):
    // the commit API commits AND PUSHES — there is no commit-without-push and no push flag. THE LOAD-BEARING RULE
    // [COUNCIL: security F1, unblock condition]: prepare_commit AND confirm_commit refuse unless a FRESH,
    // FAIL-CLOSED read (api.getApplication directly — never the gate cache) shows the target app's branch is
    // byte-exact mcp/-prefixed, and confirm_commit re-reads AT CONFIRM TIME. Protected-branch and EE rules remain
    // server-side backstops.

    interface PendingCommit {
      applicationId: string;
      branch: string;
      message: string;
      revision: string;
      appName?: string;
      expiresAt: number;
    }

    // Session-scoped side-table keyed by confirmationId: carries what the one-time gov confirmation cannot (the
    // exact message/branch the digest binds and the app name for prompts). The elicitation attempt counter lives
    // in the shared elicitationAttempts map (one mechanism for every destructive confirm tool). The gov token
    // stays the authoritative one-time credential — losing this map (a new session) just means a fresh
    // prepare_commit; a confirmation can never execute without its matching entry AND the matching gov token.
    const pendingCommits = new Map<string, PendingCommit>();

    function commitDigest(entry: {
      applicationId: string;
      branch: string;
      message: string;
      revision: string;
    }): string {
      // Binds applicationId + branch + message + the CONTENT revision, so the human approves exactly what ships
      // [COUNCIL: security F6].
      return operationDigest({
        applicationId: entry.applicationId,
        branch: entry.branch,
        message: entry.message,
        revision: entry.revision,
      });
    }

    // The commit gate's FRESH, fail-closed read: getApplication directly (never gateGitState's cache), refusing on
    // any read error, on a non-git app, on an unreadable branch, and on any branch not byte-exact mcp/-prefixed.
    async function freshMcpCommitBranch(
      applicationId: string,
    ): Promise<{ branch: string } | { error: ToolResult }> {
      let state: GitState;

      try {
        state = gitStateOf(await api.getApplication(applicationId));
      } catch {
        return {
          error: result({
            error:
              "could not verify the application's git state; refusing to commit. Retry.",
            code: "git_state_unknown",
          }),
        };
      }

      if (!state.connected) {
        return {
          error: result({
            error:
              "this application is not connected to git; prepare_commit/confirm_commit only apply to git-connected applications",
            code: "git_not_connected",
          }),
        };
      }

      if (state.branchName === undefined) {
        return {
          error: result({
            error:
              "could not verify the application's git branch; refusing to commit. Retry.",
            code: "git_state_unknown",
          }),
        };
      }

      if (!state.branchName.startsWith(MCP_BRANCH_PREFIX)) {
        return {
          error: result({
            error: `commits via MCP are only allowed on ${MCP_BRANCH_PREFIX} agent branches, because the commit API always PUSHES to the remote. This application's branch is "${state.branchName}". Create an agent branch with create_branch and commit from the NEW applicationId it returns.`,
            code: "git_commit_branch_forbidden",
            currentBranch: state.branchName,
          }),
        };
      }

      return { branch: state.branchName };
    }

    server.tool(
      "prepare_commit",
      `Prepare to COMMIT AND PUSH all current changes of a git-connected application. The commit API always pushes to the customer's git remote — there is no commit-without-push — so this is only allowed when the application's branch starts with the reserved agent prefix "mcp/" (create_branch first and use the NEW applicationId it returns). The message must be a single printable line (max ${MCP_COMMIT_MESSAGE_MAX} characters, no control/bidi characters, no binding syntax, must not start with "["); the server prepends a non-strippable "[mcp] " marker. Returns a one-time confirmationId (5-minute TTL, bound to the app, branch, message, and current content revision) plus 'relay' text you MUST show the user before calling confirm_commit. Governed.`,
      {
        applicationId: idSchema,
        message: z.string().min(1).max(1000),
      },
      async ({ applicationId, message }) => {
        const problem = commitMessageProblem(message);

        if (problem !== undefined) {
          return result({ error: problem, code: "commit_message_invalid" });
        }

        const read = await freshMcpCommitBranch(applicationId);

        if ("error" in read) return read.error;

        let pagesResponse: unknown;

        try {
          pagesResponse = await api.getApplicationPages(applicationId);
        } catch {
          return result({
            error:
              "could not read the application's current content revision; retry",
            code: "content_revision_unavailable",
          });
        }

        const revision = fingerprintPages(pagesResponse);
        const appName = applicationNameOf(pagesResponse);
        const entry: PendingCommit = {
          applicationId,
          branch: read.branch,
          message,
          revision,
          ...(appName !== undefined ? { appName } : {}),
          expiresAt: 0,
        };
        const confirmation = await gov.prepareDestructiveConfirmation({
          actorId,
          entityKey: `application:${applicationId}`,
          operation: "commit",
          revision,
          digest: commitDigest(entry),
        });

        entry.expiresAt = confirmation.expiresAt.getTime();
        pendingCommits.set(confirmation.id, entry);

        const appLabel = truncateForPrompt(appName ?? applicationId, 40);

        return result({
          confirmationId: confirmation.id,
          expiresAt: confirmation.expiresAt,
          operation: "commit",
          branch: read.branch,
          commitMessage: `${MCP_COMMIT_MARKER}${message}`,
          // Relay text for clients WITHOUT elicitation support: the agent is instructed to put this in front of
          // the human before confirming. Load-bearing facts outside the quoted agent text; "ALL current changes",
          // never an itemized claim [SECURITY REV-2 CONDITION 4].
          relay: `Show the user this and get their approval BEFORE calling confirm_commit: commit ALL current changes on branch "${promptSafe(read.branch)}" of "${promptSafe(appLabel)}" and PUSH them to the git remote. Commit message: "${MCP_COMMIT_MARKER}${promptSafe(message)}". Do not call confirm_commit without the user's explicit approval.`,
        });
      },
    );

    server.tool(
      "confirm_commit",
      'Commit AND PUSH using a one-time confirmationId from prepare_commit. Re-verifies AT CONFIRM TIME (fresh, fail-closed read) that the application\'s branch is an "mcp/" agent branch and that its content is unchanged since prepare. When the MCP client supports elicitation, the user is prompted directly and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise you must have shown the user the prepare_commit relay text and obtained their approval first. The pushed commit cannot be rolled back via MCP. Governed.',
      { applicationId: idSchema, confirmationId: idSchema },
      async ({ applicationId, confirmationId }, extra) => {
        const entry = pendingCommits.get(confirmationId);

        if (entry !== undefined && entry.expiresAt <= Date.now()) {
          pendingCommits.delete(confirmationId);
        }

        if (
          entry === undefined ||
          entry.expiresAt <= Date.now() ||
          entry.applicationId !== applicationId
        ) {
          return result({
            error:
              "commit confirmation is missing, expired, already used, or does not match this application; call prepare_commit again",
            code: "confirmation_invalid",
          });
        }

        // 1. The load-bearing rule, re-checked FRESH at confirm time (fail-closed; never the gate cache).
        const read = await freshMcpCommitBranch(applicationId);

        if ("error" in read) return read.error;

        if (read.branch !== entry.branch) {
          return result({
            error: `this application's branch is now "${read.branch}", not "${entry.branch}"; call prepare_commit again`,
            code: "git_branch_changed",
            currentBranch: read.branch,
          });
        }

        // 2. Content-revision drift check BEFORE any prompt, so the human never approves stale facts. A drifted
        // confirmation can never succeed (the revision is bound into the token), so drop the session entry; the
        // unconsumed gov token simply expires.
        let pagesResponse: unknown;

        try {
          pagesResponse = await api.getApplicationPages(applicationId);
        } catch {
          return result({
            error:
              "could not verify the application's content revision; refusing to commit. Retry.",
            code: "content_revision_unavailable",
          });
        }

        let currentRevision = fingerprintPages(pagesResponse);

        if (currentRevision !== entry.revision) {
          pendingCommits.delete(confirmationId);

          return result({
            error:
              "the application's content changed since prepare_commit; re-read the app state and call prepare_commit again",
            code: "revision_conflict",
          });
        }

        // 3. Elicitation — the shared destructive-approval layer (see elicitDestructiveApproval): prompt on
        // elicitation-capable clients, fall back to the prepare relay-text posture otherwise, and no server rule
        // relaxes either way.
        const approval = await elicitDestructiveApproval(
          {
            confirmationId,
            // The load-bearing facts (branch, app, PUSH) sit OUTSIDE the quoted agent text, and the wording is
            // "ALL current changes" — the content fingerprint is page-list-granular, so the prompt never makes
            // an itemized claim [SECURITY REV-2 CONDITION 4].
            promptMessage: () =>
              `Commit ALL current changes on branch "${promptSafe(entry.branch)}" of "${promptSafe(truncateForPrompt(entry.appName ?? entry.applicationId, 40))}" and PUSH to the remote? Message: "${promptSafe(truncateForPrompt(entry.message, 80))}"`,
            schemaTitle: "Approve commit and push",
            schemaDescription:
              "Select true to commit all current changes on the agent branch and push them to the git remote.",
            operationNoun: "commit",
            nothingHappened: "nothing was committed",
            confirmTool: "confirm_commit",
            prepareTool: "prepare_commit",
            notConfirmedCode: "commit_not_confirmed",
            invalidate: async () => {
              pendingCommits.delete(confirmationId);
              await gov.consumeDestructiveConfirmation({
                confirmationId,
                actorId,
                entityKey: `application:${applicationId}`,
                operation: "commit",
                revision: entry.revision,
                digest: commitDigest(entry),
              });
            },
          },
          extra,
        );

        if (!approval.approved) return approval.result;

        if (approval.prompted) {
          // The human may deliberate for up to the elicitation window: re-verify the content is still exactly
          // what they approved before consuming anything.
          try {
            pagesResponse = await api.getApplicationPages(applicationId);
          } catch {
            return result({
              error:
                "could not verify the application's content revision after approval; refusing to commit. Retry.",
              code: "content_revision_unavailable",
            });
          }

          currentRevision = fingerprintPages(pagesResponse);

          if (currentRevision !== entry.revision) {
            pendingCommits.delete(confirmationId);

            return result({
              error:
                "the application's content changed while awaiting approval; call prepare_commit again",
              code: "revision_conflict",
            });
          }
        }

        try {
          // 4. Consume the one-time confirmation ONLY now — after an accept (or on a non-elicitation client),
          // immediately before executing.
          await gov.consumeDestructiveConfirmation({
            confirmationId,
            actorId,
            entityKey: `application:${applicationId}`,
            operation: "commit",
            revision: entry.revision,
            digest: commitDigest(entry),
          });
          pendingCommits.delete(confirmationId);

          const fullMessage = `${MCP_COMMIT_MARKER}${entry.message}`;
          const { changeId } = await gov.execute({
            actorId,
            organizationId,
            entityKey: `application:${applicationId}`,
            operation: "commit",
            expectedRevision: entry.revision,
            currentRevision,
            mutate: async () => {
              await api.commitGitApplication(applicationId, fullMessage);

              return {
                value: {},
                revisionAfter: currentRevision,
                // A pushed commit is on the customer remote: never rollback-able from MCP.
                rollback: {},
                summary: {
                  applicationId,
                  branch: entry.branch,
                  message: fullMessage,
                },
              };
            },
          });

          // The handoff [COUNCIL: product]: branch name + branch-scoped editor URL (when slugs allow) + next
          // steps. For a git app the branch IS the deliverable — publish stays refused.
          const urls = applicationUrlsFromPages(requestOrigin, pagesResponse);
          const editorUrl =
            urls.editorUrl !== undefined
              ? `${urls.editorUrl}?branch=${encodeURIComponent(entry.branch)}`
              : undefined;

          return result({
            committed: true,
            pushedToRemote: true,
            branch: entry.branch,
            commitMessage: fullMessage,
            ...(editorUrl !== undefined ? { editorUrl } : {}),
            nextSteps: `The commit was PUSHED to the git remote on branch "${entry.branch}". Hand the user the branch${editorUrl !== undefined ? ` and the review URL (${editorUrl})` : ""} as the final deliverable: they review on this branch, merge it via Appsmith's branch UI or a pull request on the remote, then delete the mcp/ branch. Publishing from MCP stays disabled for git apps — do NOT promise a viewerUrl.`,
            changeId,
          });
        } catch (error) {
          if (
            error instanceof AppsmithApiError &&
            error.errorCode === INVALID_GIT_CONFIGURATION_CODE
          ) {
            return result({
              error:
                "the commit was refused by Appsmith because the git configuration is incomplete — the user must set their git author profile in Appsmith (git user settings), then run prepare_commit again",
              code: "invalid_git_configuration",
            });
          }

          return governanceError(error) ?? compileError(error);
        }
      },
    );

    server.tool(
      "create_page",
      "Create a new blank page in an application. The caller cannot supply DSL, actions, or bindings — only a safe page name. Pass a page-list revision from the application's pages for optimistic concurrency. Returns the safe page list, new revision, and change id.",
      {
        spec: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, spec }) => {
        const parsed = createPageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        const gate = await gitBranchGate(parsed.data.applicationId, branch);

        if (!gate.ok) return gate.result;

        const request = buildCreatePageRequest(parsed.data);
        const currentRevision = fingerprintPages(
          await api.getApplicationPages(parsed.data.applicationId),
        );

        try {
          const { changeId, value } = await gov.execute({
            actorId,
            organizationId,
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
      {
        spec: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, spec }) => {
        const parsed = renamePageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        const gate = await gitBranchGate(parsed.data.applicationId, branch);

        if (!gate.ok) return gate.result;

        const request = buildRenamePageRequest(parsed.data);
        const currentRevision = fingerprintPages(
          await api.getApplicationPages(parsed.data.applicationId),
        );

        try {
          const { changeId, value } = await gov.execute({
            actorId,
            organizationId,
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
      "Prepare to delete a page. Deleting a page is destructive, so this returns a one-time confirmation token bound to this exact page and revision, plus 'relay' text to show the user before confirming. Call confirm_delete_page with the token to perform the deletion.",
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
          // Relay text for clients WITHOUT elicitation support: shown to the human before confirming.
          relay: `Show the user this and get their approval BEFORE calling confirm_delete_page: delete the page with id "${promptSafe(parsed.data.pageId)}" and EVERYTHING on it — this cannot be undone via MCP. Do not call confirm_delete_page without the user's explicit approval.`,
        });
      },
    );

    server.tool(
      "confirm_delete_page",
      "Delete a page using a confirmation token from prepare_delete_page. The token, actor, page, and revision must all match, and the page-list revision must be unchanged since preparation. When the MCP client supports elicitation, the user is prompted for approval and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise show the user the prepare_delete_page relay text and get their approval first.",
      {
        spec: z.record(z.unknown()),
        confirmationId: idSchema,
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, confirmationId, spec }, extra) => {
        const parsed = deletePageSpecSchema.safeParse(spec);

        if (!parsed.success) return validationError(parsed.error.issues);

        // Gate BEFORE consuming the confirmation, so the one-time token is not spent on a refused mutation.
        const gate = await gitBranchGate(parsed.data.applicationId, branch);

        if (!gate.ok) return gate.result;

        // Elicitation AFTER every refusal gate and BEFORE token consumption: a declined prompt leaves the
        // one-time confirmation intact and consumable later.
        const approval = await elicitDestructiveApproval(
          {
            confirmationId,
            // Best-effort label read (runs only on elicitation-capable clients): name the page and app when
            // readable, else fall back to the ids — the digest binds the ids, never the labels.
            promptMessage: async () => {
              let pageLabel = parsed.data.pageId;
              let appLabel = parsed.data.applicationId;

              try {
                const pagesResponse = await api.getApplicationPages(
                  parsed.data.applicationId,
                );
                const page = projectPages(pagesResponse).find(
                  (entry) => entry.id === parsed.data.pageId,
                );

                if (page !== undefined && page.name.length > 0) {
                  pageLabel = page.name;
                }

                appLabel = applicationNameOf(pagesResponse) ?? appLabel;
              } catch {
                // Label read failed: prompt with the ids rather than refuse.
              }

              return `Delete the page "${promptSafe(truncateForPrompt(pageLabel, 40))}" from "${promptSafe(truncateForPrompt(appLabel, 40))}"? This deletes the page and EVERYTHING on it, and cannot be undone via MCP.`;
            },
            schemaTitle: "Approve page deletion",
            schemaDescription:
              "Select true to delete this page and everything on it.",
            operationNoun: "page deletion",
            nothingHappened: "nothing was deleted",
            confirmTool: "confirm_delete_page",
            prepareTool: "prepare_delete_page",
            notConfirmedCode: "delete_page_not_confirmed",
            invalidate: async () =>
              gov.consumeDestructiveConfirmation({
                confirmationId,
                actorId,
                entityKey: pagesEntityKey(parsed.data.applicationId),
                operation: "delete_page",
                revision: parsed.data.revision,
                digest: operationDigest({
                  applicationId: parsed.data.applicationId,
                  pageId: parsed.data.pageId,
                }),
              }),
          },
          extra,
        );

        if (!approval.approved) return approval.result;

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
          markElicitationConsumed(confirmationId);

          const currentRevision = fingerprintPages(
            await api.getApplicationPages(parsed.data.applicationId),
          );
          const { changeId, value } = await gov.execute({
            actorId,
            organizationId,
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
      "Create a datasource in a workspace. Supported: PostgreSQL/MySQL/Microsoft SQL Server/Oracle/Amazon Redshift/MongoDB databases (pass `connection` with non-secret host/port/database/username; the password is completed later in the Appsmith UI), and REST APIs (pass `url` with the base URL — created ready to use when the API needs no auth). Google Sheets is NOT creatable here: it needs interactive OAuth that must be authorized in the Appsmith UI; create+authorize it there, then query it with create_sheets_query. Credentials are NEVER accepted or transmitted by this tool. Idempotent by workspace + name.",
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
        plugin: z.enum([
          "postgresql",
          "mysql",
          "mssql",
          "mongodb",
          "oracle",
          "redshift",
          "rest",
          "googlesheets",
        ]),
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
        // Google Sheets requires interactive OAuth (a user-consent flow) that MUST be completed in the Appsmith UI.
        // MCP never carries OAuth tokens or credentials, so it cannot create/authorize a Sheets datasource — provide
        // a clear hand-off instead of a foreign config. The agent references the authorized datasource afterwards.
        if (plugin === "googlesheets") {
          return result({
            error:
              'Google Sheets datasources require interactive OAuth authorization, which can only be done in the Appsmith UI — MCP never handles credentials or OAuth tokens. Ask the user to open Appsmith -> workspace -> Datasources -> New datasource -> "Google Sheets", authorize their Google account, then find it with list_datasources and author read/append queries with create_sheets_query.',
            code: "needs_ui_oauth",
          });
        }

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
      "Create a SQL query (SELECT/INSERT/UPDATE/DELETE) on a datasource from a STRUCTURED spec — no raw SQL, no raw bindings. Values become prepared-statement parameters. SELECT supports columns/filters/limit plus orderBy [{column,direction}], aggregation {fn:count|sum|avg,column?}, and groupBy. Widgets then reference it by name (table.source={query} / button.onClick={run}). Idempotent by page + name.",
      {
        query: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, query }) => {
        const parsed = querySpecSchema.safeParse(query);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;

        const gate = await gitBranchGate(spec.applicationId, branch);

        if (!gate.ok) return gate.result;

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
      {
        api: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ api: restApi, branch }) => {
        const parsed = restApiSpecSchema.safeParse(restApi);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;

        const gate = await gitBranchGate(spec.applicationId, branch);

        if (!gate.ok) return gate.result;

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
      "create_mongo_query",
      "Create a MongoDB query (find or insert) on an existing Mongo datasource from a STRUCTURED spec — no raw Mongo command, no raw bindings. find { collection, filter?: [{ field, value }], sort?: [{ field, direction: 'ASC'|'DESC' }], limit? } returns matching documents (filter clauses are AND-ed equality); insert { collection, document: [{ field, value }] } adds one document. Each value is { literal } or { widget, property } and binds as a smart-substitution parameter (never string-concatenated); field/collection names are validated identifiers. Widgets reference the result by name (table.source={query} / button.onClick={run}). Idempotent by page + name.",
      {
        query: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, query }) => {
        const parsed = mongoQuerySpecSchema.safeParse(query);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;

        const gate = await gitBranchGate(spec.applicationId, branch);

        if (!gate.ok) return gate.result;

        // Resolve the workspace SERVER-AUTHORITATIVELY from the application (cross-tenant guard), exactly like
        // create_query.
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

        if (!isMongoDatasource(datasources, plugins, spec.datasourceId)) {
          return result({
            error: "create_mongo_query requires an existing MongoDB datasource",
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

        let compiled: ReturnType<typeof compileMongoQuery>;

        try {
          compiled = compileMongoQuery(spec);
        } catch (error) {
          return compileError(error);
        }

        const created = await api.createAction(
          buildMongoActionDto(spec, compiled),
        );

        return result({
          created: true,
          command: compiled.command,
          action: created,
        });
      },
    );

    server.tool(
      "create_redis_query",
      "Create a Redis command on an existing Redis datasource from a STRUCTURED spec — no raw Redis command string, no raw bindings. Pass { applicationId, pageId, datasourceId, name, command, key, ... }. command is an allow-listed verb: reads GET/EXISTS/TTL/TYPE/STRLEN/LLEN/SMEMBERS/SCARD/HGETALL/HKEYS/HVALS, writes SET/APPEND/LPUSH/RPUSH/SADD/SREM/DEL/INCR/DECR/HSET/HDEL/EXPIRE/LRANGE. Provide value (SET/APPEND/list/set writes, HSET), field (HGET/HDEL/HSET), seconds (EXPIRE), or start+stop (LRANGE). Each value is { literal } (a single token — no whitespace/quotes) or { widget, property } (resolved to the widget's value at runtime); keys/fields are single-token identifiers. The compiler emits exactly one Redis command line. MCP never creates a Redis datasource (create it in the Appsmith UI with host/port, then find it with list_datasources). Idempotent by page + name. NOTE: the emitted Redis action config is PROVISIONAL — modeled from Appsmith's Redis plugin editor form but not yet verified end-to-end against a live datasource; validate in your instance before relying on it.",
      {
        query: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, query }) => {
        const parsed = redisQuerySpecSchema.safeParse(query);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;

        const gate = await gitBranchGate(spec.applicationId, branch);

        if (!gate.ok) return gate.result;

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

        if (!isRedisDatasource(datasources, plugins, spec.datasourceId)) {
          return result({
            error: "create_redis_query requires an existing Redis datasource",
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
            reason: "a query with this name already exists on this page",
            action: existing,
          });
        }

        let compiled: ReturnType<typeof compileRedisQuery>;

        try {
          compiled = compileRedisQuery(spec);
        } catch (error) {
          return compileError(error);
        }

        const created = await api.createAction(
          buildRedisActionDto(spec, compiled),
        );

        return result({
          created: true,
          command: compiled.body,
          action: created,
        });
      },
    );

    server.tool(
      "create_sheets_query",
      "Create a Google Sheets query (read or append) on an ALREADY-AUTHORIZED Google Sheets datasource from a STRUCTURED spec. MCP never creates or authorizes a Sheets datasource (OAuth is interactive and stays in the Appsmith UI) — create+authorize it there first, then reference it here by datasourceId (find it with list_datasources). read { sheetUrl, sheetName, range?, columns?, limit? } fetches rows (optional A1 range like 'A2:Z' and column projection); append { sheetUrl, sheetName, row: [{ column, value }] } adds one row. Row values are { literal } or { widget, property } bound as smart-substitution parameters; sheetUrl/sheetName/range/columns are validated static identifiers. No raw formulas or bindings; for a specific-sheets (drive.file) datasource the server restricts execution to its OAuth-authorized spreadsheets. Idempotent by page + name. NOTE: the emitted Sheets action config is PROVISIONAL — modeled from Appsmith's Sheets plugin forms but not yet verified end-to-end against a live authorized datasource; validate a read + append in your instance before relying on it.",
      {
        query: z.record(z.unknown()),
        branch: gitBranchParamSchema.optional(),
      },
      async ({ branch, query }) => {
        const parsed = sheetsQuerySpecSchema.safeParse(query);

        if (!parsed.success) return validationError(parsed.error.issues);

        const spec = parsed.data;

        const gate = await gitBranchGate(spec.applicationId, branch);

        if (!gate.ok) return gate.result;

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

        if (!isSheetsDatasource(datasources, plugins, spec.datasourceId)) {
          return result({
            error:
              "create_sheets_query requires an existing, already-authorized Google Sheets datasource (create and authorize it in the Appsmith UI first)",
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
            reason: "a query with this name already exists on this page",
            action: existing,
          });
        }

        let compiled: ReturnType<typeof compileSheetsQuery>;

        try {
          compiled = compileSheetsQuery(spec);
        } catch (error) {
          return compileError(error);
        }

        const created = await api.createAction(
          buildSheetsActionDto(spec, compiled),
        );

        return result({
          created: true,
          command: compiled.command,
          action: created,
        });
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
        {
          spec: z.record(z.unknown()),
          branch: gitBranchParamSchema.optional(),
        },
        async ({ branch, spec }) => {
          const parsed = updateActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const request = buildUpdateActionDto(parsed.data);
          const gate = await gitBranchGate(request.applicationId, branch);

          if (!gate.ok) return gate.result;

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
              organizationId,
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
        {
          spec: z.record(z.unknown()),
          branch: gitBranchParamSchema.optional(),
        },
        async ({ branch, spec }) => {
          const parsed = duplicateActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const request = buildDuplicateActionDto(parsed.data);
          const gate = await gitBranchGate(request.applicationId, branch);

          if (!gate.ok) return gate.result;

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
              organizationId,
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
        "Prepare to delete an action. Returns a one-time confirmation token bound to this exact action and revision, plus 'relay' text to show the user before confirming. Call confirm_delete_action with the token to delete it.",
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
            // Relay text for clients WITHOUT elicitation support: shown to the human before confirming.
            relay: `Show the user this and get their approval BEFORE calling confirm_delete_action: delete the action with id "${promptSafe(parsed.data.actionId)}" (its query/API definition) — this cannot be undone via MCP. Do not call confirm_delete_action without the user's explicit approval.`,
          });
        },
      );

      server.tool(
        "confirm_delete_action",
        "Delete an action using a confirmation token from prepare_delete_action. Token, actor, action, and revision must all match, and the action's revision must be unchanged since preparation. When the MCP client supports elicitation, the user is prompted for approval and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise show the user the prepare_delete_action relay text and get their approval first.",
        {
          spec: z.record(z.unknown()),
          confirmationId: idSchema,
          branch: gitBranchParamSchema.optional(),
        },
        async ({ branch, confirmationId, spec }, extra) => {
          const parsed = deleteActionSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          // Gate BEFORE consuming the confirmation, so the one-time token is not spent on a refused mutation.
          const gate = await gitBranchGate(parsed.data.applicationId, branch);

          if (!gate.ok) return gate.result;

          // Elicitation AFTER every refusal gate and BEFORE token consumption: a declined prompt leaves the
          // one-time confirmation intact and consumable later.
          const approval = await elicitDestructiveApproval(
            {
              confirmationId,
              // Best-effort label read (elicitation-capable clients only): name the action and its datasource
              // when readable, else fall back to the id — the digest binds the ids, never the labels.
              promptMessage: async () => {
                let facts: { name?: string; datasource?: string } = {};

                try {
                  facts = actionPromptFacts(
                    await api.getAction(
                      parsed.data.applicationId,
                      parsed.data.actionId,
                    ),
                  );
                } catch {
                  // Label read failed: prompt with the id rather than refuse.
                }

                const label = truncateForPrompt(
                  facts.name ?? parsed.data.actionId,
                  40,
                );

                return `Delete the action "${promptSafe(label)}"${facts.datasource !== undefined ? ` (datasource: "${promptSafe(truncateForPrompt(facts.datasource, 60))}")` : ""}? This deletes the query/API definition and cannot be undone via MCP.`;
              },
              schemaTitle: "Approve action deletion",
              schemaDescription:
                "Select true to delete this action (its query/API definition).",
              operationNoun: "action deletion",
              nothingHappened: "nothing was deleted",
              confirmTool: "confirm_delete_action",
              prepareTool: "prepare_delete_action",
              notConfirmedCode: "delete_action_not_confirmed",
              invalidate: async () =>
                govData.consumeDestructiveConfirmation({
                  confirmationId,
                  actorId,
                  entityKey: `action:${parsed.data.actionId}`,
                  operation: "delete_action",
                  revision: parsed.data.revision,
                  digest: operationDigest({
                    applicationId: parsed.data.applicationId,
                    actionId: parsed.data.actionId,
                  }),
                }),
            },
            extra,
          );

          if (!approval.approved) return approval.result;

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
            markElicitationConsumed(confirmationId);

            const current = await api.getAction(
              parsed.data.applicationId,
              parsed.data.actionId,
            );
            const { changeId } = await govData.execute({
              actorId,
              organizationId,
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
        "Prepare to run an action. Non-read-only executions require this confirmation step. Returns a one-time token bound to this action and revision, whether the action is read-only, and 'relay' text to show the user before confirming. Pass a revision from get_action.",
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
          const facts = actionPromptFacts(action);
          const label = truncateForPrompt(facts.name ?? actionId, 40);

          return result({
            confirmationId: confirmation.id,
            expiresAt: confirmation.expiresAt,
            operation: "run_action",
            readOnly: isReadOnlyAction(action),
            // Relay text for clients WITHOUT elicitation support: shown to the human before confirming.
            relay: `Show the user this and get their approval BEFORE calling confirm_run_action: run the action "${promptSafe(label)}"${facts.datasource !== undefined ? ` against datasource "${promptSafe(truncateForPrompt(facts.datasource, 60))}"` : ""} — it executes with its current configuration and may modify data. Do not call confirm_run_action without the user's explicit approval.`,
          });
        },
      );

      server.tool(
        "confirm_run_action",
        "Run an action using a confirmation token from prepare_run_action. Token, actor, action, and revision must match, and the action must be unchanged since preparation. When the MCP client supports elicitation, the user is prompted for approval and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise show the user the prepare_run_action relay text and get their approval first. Returns the execution result and an audit change id.",
        {
          applicationId: idSchema,
          actionId: idSchema,
          revision: z.string().regex(/^[a-f0-9]{64}$/),
          confirmationId: idSchema,
        },
        async (
          { actionId, applicationId, confirmationId, revision },
          extra,
        ) => {
          // Elicitation BEFORE token consumption: a declined prompt leaves the one-time confirmation intact and
          // consumable later.
          const approval = await elicitDestructiveApproval(
            {
              confirmationId,
              // Best-effort label read (elicitation-capable clients only): name the action and its datasource
              // when readable, else fall back to the id — the digest binds the ids, never the labels.
              promptMessage: async () => {
                let facts: { name?: string; datasource?: string } = {};

                try {
                  facts = actionPromptFacts(
                    await api.getAction(applicationId, actionId),
                  );
                } catch {
                  // Label read failed: prompt with the id rather than refuse.
                }

                const label = truncateForPrompt(facts.name ?? actionId, 40);

                return `Run the action "${promptSafe(label)}"${facts.datasource !== undefined ? ` against datasource "${promptSafe(truncateForPrompt(facts.datasource, 60))}"` : ""}? This EXECUTES it with its current configuration and may modify data.`;
              },
              schemaTitle: "Approve action run",
              schemaDescription:
                "Select true to execute this action with its current configuration.",
              operationNoun: "action run",
              nothingHappened: "nothing was run",
              confirmTool: "confirm_run_action",
              prepareTool: "prepare_run_action",
              notConfirmedCode: "run_action_not_confirmed",
              invalidate: async () =>
                govData.consumeDestructiveConfirmation({
                  confirmationId,
                  actorId,
                  entityKey: `action:${actionId}`,
                  operation: "run_action",
                  revision,
                  digest: operationDigest({ actionId }),
                }),
            },
            extra,
          );

          if (!approval.approved) return approval.result;

          try {
            await govData.consumeDestructiveConfirmation({
              confirmationId,
              actorId,
              entityKey: `action:${actionId}`,
              operation: "run_action",
              revision,
              digest: operationDigest({ actionId }),
            });
            markElicitationConsumed(confirmationId);

            const current = await api.getAction(applicationId, actionId);
            const { changeId, value } = await govData.execute({
              actorId,
              organizationId,
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
        {
          spec: z.record(z.unknown()),
          branch: gitBranchParamSchema.optional(),
        },
        async ({ branch, spec }) => {
          const raw = spec as Record<string, unknown>;
          const applicationId = raw.applicationId;

          if (typeof applicationId !== "string") {
            return result({ error: "spec.applicationId is required" });
          }

          const gate = await gitBranchGate(applicationId, branch);

          if (!gate.ok) return gate.result;

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
              organizationId,
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
        {
          spec: z.record(z.unknown()),
          branch: gitBranchParamSchema.optional(),
        },
        async ({ branch, spec }) => {
          const parsed = updateJsObjectSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          const gate = await gitBranchGate(parsed.data.applicationId, branch);

          if (!gate.ok) return gate.result;

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
              organizationId,
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
        "Prepare to delete a JS object. Returns a one-time confirmation token bound to this object and revision, plus 'relay' text to show the user before confirming.",
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
            // Relay text for clients WITHOUT elicitation support: shown to the human before confirming.
            relay: `Show the user this and get their approval BEFORE calling confirm_delete_js_object: delete the JS object with id "${promptSafe(parsed.data.collectionId)}" and all its functions — this cannot be undone via MCP. Do not call confirm_delete_js_object without the user's explicit approval.`,
          });
        },
      );

      server.tool(
        "confirm_delete_js_object",
        "Delete a JS object using a confirmation token from prepare_delete_js_object. Token, actor, object, and revision must all match. When the MCP client supports elicitation, the user is prompted for approval and ONLY an explicit accept proceeds (at most 3 prompts per confirmation, then it is invalidated); otherwise show the user the prepare_delete_js_object relay text and get their approval first.",
        {
          spec: z.record(z.unknown()),
          confirmationId: idSchema,
          branch: gitBranchParamSchema.optional(),
        },
        async ({ branch, confirmationId, spec }, extra) => {
          const parsed = deleteJsObjectSpecSchema.safeParse(spec);

          if (!parsed.success) return validationError(parsed.error.issues);

          // Gate BEFORE consuming the confirmation, so the one-time token is not spent on a refused mutation.
          const gate = await gitBranchGate(parsed.data.applicationId, branch);

          if (!gate.ok) return gate.result;

          // Elicitation AFTER every refusal gate and BEFORE token consumption: a declined prompt leaves the
          // one-time confirmation intact and consumable later.
          const approval = await elicitDestructiveApproval(
            {
              confirmationId,
              // Best-effort label read (elicitation-capable clients only): name the JS object when readable,
              // else fall back to the id — the digest binds the ids, never the labels.
              promptMessage: async () => {
                let label = parsed.data.collectionId;

                try {
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
                  const name = (current as { name?: unknown } | undefined)
                    ?.name;

                  if (typeof name === "string" && name.length > 0) {
                    label = name;
                  }
                } catch {
                  // Label read failed: prompt with the id rather than refuse.
                }

                return `Delete the JS object "${promptSafe(truncateForPrompt(label, 40))}" and ALL its functions? This cannot be undone via MCP.`;
              },
              schemaTitle: "Approve JS object deletion",
              schemaDescription:
                "Select true to delete this JS object and all its functions.",
              operationNoun: "JS object deletion",
              nothingHappened: "nothing was deleted",
              confirmTool: "confirm_delete_js_object",
              prepareTool: "prepare_delete_js_object",
              notConfirmedCode: "delete_js_object_not_confirmed",
              invalidate: async () =>
                govJs.consumeDestructiveConfirmation({
                  confirmationId,
                  actorId,
                  entityKey: `jsobject:${parsed.data.collectionId}`,
                  operation: "delete_js_object",
                  revision: parsed.data.revision,
                  digest: operationDigest({
                    applicationId: parsed.data.applicationId,
                    collectionId: parsed.data.collectionId,
                  }),
                }),
            },
            extra,
          );

          if (!approval.approved) return approval.result;

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
            markElicitationConsumed(confirmationId);

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
              organizationId,
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

// The telemetry line correlates events per user WITHOUT recording the user's identity in plaintext: the username is
// the caller's email, so it is hashed (SHA-256 hex, matching the server-side DigestUtils.sha256Hex posture) before it
// ever reaches the log. The hash is stable, so per-user aggregation still works, but the log never carries a raw
// email that could sit in aggregation storage.
function hashUsername(username: string | undefined): string | undefined {
  if (!username) return undefined;

  return createHash("sha256").update(username).digest("hex");
}

// M4-T4 adoption telemetry: collapse the raw HTTP status into a coarse outcome class so we can measure
// success/failure rates per tool WITHOUT leaking the error message or response body. Intentionally coarse.
function mcpStatusClass(status: number): string {
  if (status >= 500) return "server_error";

  if (status >= 400) return "client_error";

  if (status >= 200 && status < 300) return "success";

  return "other";
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
  // Validated absolute http(s) origin (APPSMITH_MCP_PUBLIC_ORIGIN, parsed fail-closed by publicOriginFromEnv) used
  // for the editor/viewer URLs build_application returns. When unset, the origin is derived per session from the
  // INITIALIZE request's validated X-Forwarded-Proto + Host headers; when that also fails, URLs are root-relative.
  publicOrigin?: string;
  // Override for the destructive confirm tools' elicitation wait (default MCP_ELICITATION_TIMEOUT_MS); injectable
  // for tests.
  elicitationTimeoutMs?: number;
  // Deprecated alias for elicitationTimeoutMs (from when only confirm_commit prompted); elicitationTimeoutMs wins.
  commitElicitationTimeoutMs?: number;
  // Interval between notifications/progress pings during an elicitation wait (default
  // ELICITATION_PROGRESS_INTERVAL_MS); injectable for tests, like the timeout.
  elicitationProgressIntervalMs?: number;
  // Operator escape hatch (APPSMITH_MCP_DISABLE_ELICITATION): forces the relay posture for every session —
  // see ServerContext.elicitationDisabled.
  elicitationDisabled?: boolean;
  // Operator strict mode (APPSMITH_MCP_STRICT_ELICITATION): requires in-band prompts, refuses relay — see
  // ServerContext.elicitationStrict. Wins over elicitationDisabled.
  elicitationStrict?: boolean;
  // Operator-facing log line sink (default: process.stderr) — see ServerContext.logSink.
  logSink?: (line: string) => void;
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

// Origin for agent-facing absolute URLs, derived from the INITIALIZE request's forwarded headers (used only when no
// APPSMITH_MCP_PUBLIC_ORIGIN is configured). Strict by design [COUNCIL: security + architect]: X-Forwarded-Proto must
// be EXACTLY "http" or "https" (Caddy sets a single value; a forged/duplicated header fails the literal comparison),
// the Host must pass the hostname[:port] charset check, and when a Host allowlist is configured the hostname must be
// in it. ANY failure returns undefined so URLs degrade to root-relative paths — a guessed absolute origin built from
// a forged Host/proto on direct port access would put a phishing-grade URL in a trusted agent channel. Exported for
// direct unit testing.
export function sessionOriginFromHeaders(
  headers: { "x-forwarded-proto"?: unknown; host?: unknown },
  allowedHosts: ReadonlySet<string>,
): string | undefined {
  const proto = headers["x-forwarded-proto"];

  if (proto !== "http" && proto !== "https") return undefined;

  const host =
    typeof headers.host === "string" ? headers.host.trim().toLowerCase() : "";

  if (!/^[a-z0-9.-]+(:[0-9]+)?$/.test(host)) return undefined;

  if (allowedHosts.size > 0 && !allowedHosts.has(hostHeaderName(host))) {
    return undefined;
  }

  return `${proto}://${host}`;
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
  // M4-T4 adoption telemetry: a compact, PII-free summary of which gated tool families are enabled for this
  // server instance (e.g. "data,js,gov"). Threaded into every request event so gaps between what is deployed
  // and what agents actually use are measurable.
  const gateSummary = [
    dataEnabled ? "data" : undefined,
    jsEnabled ? "js" : undefined,
    governance ? "gov" : undefined,
  ]
    .filter(Boolean)
    .join(",");
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

  async function authenticateProfile(
    api: AppsmithApi,
  ): Promise<{ username: string; isAdmin: boolean; organizationId: string }> {
    let profile: {
      username?: string;
      isAnonymous?: boolean;
      isSuperUser?: boolean;
      organizationId?: string;
    };

    try {
      profile = (await api.validateToken()) as {
        username?: string;
        isAnonymous?: boolean;
        isSuperUser?: boolean;
        organizationId?: string;
      };
    } catch {
      throw new HttpError(401, "invalid bearer token");
    }

    if (!profile || profile.isAnonymous === true || !profile.username) {
      throw new HttpError(401, "invalid bearer token");
    }

    // isSuperUser on /api/v1/users/me gates the cross-actor audit read. On a SINGLE-org (CE) instance it is the
    // instance super-admin; on a multi-org (EE) instance it is a PER-ORG admin signal (MANAGE_ORGANIZATION on the
    // caller's own org), so it must be paired with organizationId — every audit read is scoped to that tenant so an
    // org admin can never see another tenant's change history. organizationId is the caller's own org on
    // /api/v1/users/me; absent on an older server, which fails closed (org-scoped reads then match nothing).
    return {
      username: profile.username,
      isAdmin: profile.isSuperUser === true,
      organizationId:
        typeof profile.organizationId === "string"
          ? profile.organizationId
          : "",
    };
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
      // This structured stderr line IS the Node-side M4-T4 telemetry: the Node process cannot reach Java's
      // Segment/AnalyticsService, so rather than building a fragile Node->Java analytics bridge we emit a
      // machine-readable event consumable by log aggregation. It carries the tool name, a coarse success/error
      // CLASS (never the error message or body), and the gate state (data/js/gov) — and deliberately still omits
      // tokens, tool arguments, and request bodies.
      logMcpEvent("appsmith_mcp_request", {
        requestId,
        path: (req.url ?? "").split("?")[0],
        httpMethod: req.method,
        mcpMethod: operation.method,
        tool: operation.tool,
        usernameHash: hashUsername(username),
        status: res.statusCode,
        statusClass: mcpStatusClass(res.statusCode),
        gates: gateSummary,
        durationMs: Date.now() - startedAt,
      });
    });

    try {
      const path = (req.url ?? "").split("?")[0];

      if (path === "/health") {
        // Carries the build identity (version + optional deploy-stamped buildTime) so operators can answer
        // "which build is this instance running" without an authenticated MCP session.
        writeJson(res, 200, { status: "ok", ...MCP_BUILD_INFO });

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

        username = (
          await authenticateProfile(createApi(token, upstreamHeaders))
        ).username;
        session.expiresAt = now() + sessionTtlMs;
      }

      if (!transport && isInitializeRequest(body)) {
        const api = createApi(token, upstreamHeaders);
        const {
          isAdmin,
          organizationId,
          username: authenticatedUser,
        } = await authenticateProfile(api);

        username = authenticatedUser;

        // Check-and-reserve synchronously (no await between reading the counts and incrementing the reservation)
        // so a burst of concurrent initializes can't all slip past the caps. `sessions.size + pendingTotal` counts
        // both registered and in-flight sessions.
        let userSessionCount = pendingByUser.get(authenticatedUser) ?? 0;

        for (const existing of sessions.values()) {
          if (existing.username === authenticatedUser) userSessionCount += 1;
        }

        // At the per-user cap, evict this user's own least-recently-active registered session(s) instead of
        // rejecting: sessions from unclean disconnects (dropped SSE streams, proxy timeouts) never fire
        // transport.onclose and would otherwise lock the user out until the TTL sweep. Eviction is safe here
        // because the request is already authenticated as this same user, so a caller can only ever displace
        // their own sessions — never another user's (the global cap below stays a hard reject for that reason).
        // Pending reservations are not evictable, so a cap consumed entirely by in-flight initializes still 429s.
        //
        // Victims are only selected here; they are closed after BOTH caps admit the request, so a request that
        // is rejected anyway never destroys a session. Smallest expiresAt == least recently active: every touch
        // sets expiresAt to now + sessionTtlMs and the TTL is constant for the life of the process. (If TTLs
        // ever become per-session, switch to an explicit lastActiveAt field.)
        const evictable: string[] = [];

        if (userSessionCount >= maxSessionsPerUser) {
          const own = [...sessions.entries()]
            .filter(([, existing]) => existing.username === authenticatedUser)
            .sort(([, a], [, b]) => a.expiresAt - b.expiresAt);

          for (const [id] of own) {
            if (userSessionCount - evictable.length < maxSessionsPerUser) {
              break;
            }

            evictable.push(id);
          }
        }

        if (sessions.size - evictable.length + pendingTotal >= maxSessions) {
          writeJson(res, 503, { error: "MCP session limit reached" });

          return;
        }

        if (userSessionCount - evictable.length >= maxSessionsPerUser) {
          writeJson(res, 429, {
            error: "MCP session limit reached for this user",
          });

          return;
        }

        for (const id of evictable) {
          const evicted = sessions.get(id);

          if (!evicted) continue;

          sessions.delete(id);
          void evicted.transport.close().catch(() => {});
          // Evictions displace what may be a live session, so leave a trace: without this, a victim's "my
          // session died" (or an attacker churning a stolen token to kill sessions) is indistinguishable from
          // ordinary reconnects in the logs. PII-free, same shape as the request telemetry.
          logMcpEvent("appsmith_mcp_session_evicted", {
            requestId,
            usernameHash: hashUsername(authenticatedUser),
            idleMs: Math.max(0, sessionTtlMs - (evicted.expiresAt - now())),
          });
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
          isAdmin,
          organizationId,
          elicitationTimeoutMs: options.elicitationTimeoutMs,
          commitElicitationTimeoutMs: options.commitElicitationTimeoutMs,
          elicitationProgressIntervalMs: options.elicitationProgressIntervalMs,
          elicitationDisabled: options.elicitationDisabled,
          elicitationStrict: options.elicitationStrict,
          logSink: options.logSink,
          // Session-scoped origin for the URLs build_application returns, captured once here at initialize so
          // tool handlers never touch raw requests (same seam as actorId/isAdmin). The configured public origin
          // wins; header derivation is the validated fallback; undefined means root-relative URLs.
          requestOrigin:
            options.publicOrigin ??
            sessionOriginFromHeaders(req.headers, allowedHosts),
        }).connect(transport);
      }

      if (!transport) {
        // Streamable HTTP spec, session management: a request whose Mcp-Session-Id the server no longer
        // recognizes (expired, evicted, restarted) MUST get 404 — that status is the defined signal on which a
        // compliant client transparently starts a new session with a fresh InitializeRequest. A 400 here strands
        // such clients (observed with ChatGPT: it surfaces "400" failures instead of reconnecting). A request
        // with NO session id that is not an initialize stays 400 per the same spec section.
        if (sessionId !== undefined) {
          writeJson(res, 404, {
            error: "session not found; initialize a new MCP session",
          });

          return;
        }

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
