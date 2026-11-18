import { z } from "zod";
import {
  buildActionDto,
  compileQuery,
  markMcpAuthoredBody,
  querySpecSchema,
  type CompileQueryOptions,
  type QuerySpec,
} from "./query.js";
import {
  buildRestActionDto,
  compileRestApi,
  restApiSpecSchema,
  type RestApiSpec,
} from "./restApi.js";
import { storedId } from "./schema.js";
import {
  buildSmtpActionDto,
  compileSmtpQuery,
  smtpQuerySpecSchema,
  type SmtpQuerySpec,
} from "./smtpQuery.js";

// Lifecycle operations identify an already stored action. They deliberately have no escape hatch for inline
// datasource settings, raw SQL, or arbitrary action configuration.
//
// Stored IDs use the shared `storedId` schema — see schema.ts for why the charset is the security property here.
const identifier = storedId;
const actionName = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");
const revision = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "must be a SHA-256 revision token");

const actionReferenceSchema = z
  .object({
    actionId: identifier,
    applicationId: identifier,
    revision,
  })
  .strict();

const sqlUpdateSchema = actionReferenceSchema
  .extend({
    kind: z.literal("SQL"),
    // A SQL update is always compiled from the existing structured-query vocabulary; raw body text is not accepted.
    query: querySpecSchema.optional(),
    name: actionName.optional(),
  })
  .strict();

const restUpdateSchema = actionReferenceSchema
  .extend({
    kind: z.literal("REST"),
    // REST configuration is likewise rebuilt from the restricted REST vocabulary. It cannot carry credentials,
    // base URLs, arbitrary headers, or a raw binding.
    rest: restApiSpecSchema.optional(),
    name: actionName.optional(),
  })
  .strict();

const smtpUpdateSchema = actionReferenceSchema
  .extend({
    kind: z.literal("SMTP"),
    // An email is rebuilt from create_smtp_query's vocabulary. The SMTP server and credentials stay in the datasource.
    email: smtpQuerySpecSchema.optional(),
    name: actionName.optional(),
  })
  .strict();

type AnyUpdate =
  | z.infer<typeof sqlUpdateSchema>
  | z.infer<typeof restUpdateSchema>
  | z.infer<typeof smtpUpdateSchema>;

// The spec key that holds each update kind's structured configuration. update_action and the action-container seam
// both read it, so the kinds and keys stay in one place.
export const UPDATE_SOURCE_KEYS = {
  SQL: "query",
  REST: "rest",
  SMTP: "email",
} as const;

export type UpdateActionKind = keyof typeof UPDATE_SOURCE_KEYS;

// The structured configuration an update carries, and its key in the spec (for error paths).
function updateSource(spec: AnyUpdate): {
  key: (typeof UPDATE_SOURCE_KEYS)[UpdateActionKind];
  source: QuerySpec | RestApiSpec | SmtpQuerySpec | undefined;
} {
  const key = UPDATE_SOURCE_KEYS[spec.kind];

  if (spec.kind === "SQL") return { key, source: spec.query };

  if (spec.kind === "REST") return { key, source: spec.rest };

  return { key, source: spec.email };
}

export const updateActionSpecSchema = z
  .union([sqlUpdateSchema, restUpdateSchema, smtpUpdateSchema])
  .superRefine((spec, context) => {
    const { key, source } = updateSource(spec);

    if (spec.name === undefined && source === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "must update a name or structured action configuration",
      });

      return;
    }

    if (!source) return;

    if (source.applicationId !== spec.applicationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key, "applicationId"],
        message: "must match the action applicationId",
      });
    }

    if (spec.name !== undefined && source.name !== spec.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key, "name"],
        message: "must match the update name",
      });
    }
  });

export const duplicateActionSpecSchema = actionReferenceSchema
  .extend({
    kind: z.enum(["SQL", "REST", "SMTP"]),
    name: actionName,
  })
  .strict();

// APP-16526: copy a stored action to a page of another app, or another page of the same app. The source is the
// stored action (actionId, applicationId, revision from get_action). The target names a page and, optionally, a
// datasource. No action configuration is accepted: the MCP server copies the stored one.
export const copyActionSpecSchema = actionReferenceSchema
  .extend({
    name: actionName,
    target: z
      .object({
        applicationId: identifier,
        pageId: identifier,
        // Needed when the source datasource is not in the target app's workspace. It must use the same plugin.
        datasourceId: identifier.optional(),
      })
      .strict(),
  })
  .strict();

// Deletion intentionally has no optional fields: the application/revision pair is required for optimistic
// concurrency, while the stored action ID is the only action identifier the caller may supply.
export const deleteActionSpecSchema = actionReferenceSchema;

export type UpdateActionSpec = z.infer<typeof updateActionSpecSchema>;
export type DuplicateActionSpec = z.infer<typeof duplicateActionSpecSchema>;
export type CopyActionSpec = z.infer<typeof copyActionSpecSchema>;
export type DeleteActionSpec = z.infer<typeof deleteActionSpecSchema>;

export interface ActionLifecycleRequest {
  actionId: string;
  applicationId: string;
  revision: string;
}

export interface UpdateActionRequest extends ActionLifecycleRequest {
  action: Record<string, unknown>;
}

function buildUpdateAction(
  spec: UpdateActionSpec,
  options: CompileQueryOptions,
): Record<string, unknown> {
  const { source } = updateSource(spec);
  const action: Record<string, unknown> = { id: spec.actionId };
  const name = spec.name ?? source?.name;

  if (name !== undefined) action.name = name;

  if (!source) return action;

  if (spec.kind === "SQL") {
    const query = source as QuerySpec;
    const body = compileQuery(query, options);
    // The stored body carries the MCP-authored marker, so get_action can return it until someone edits it.
    const compiled = buildActionDto(
      query,
      markMcpAuthoredBody(body),
      options.packageName,
    );

    return { id: spec.actionId, ...compiled };
  }

  if (spec.kind === "SMTP") {
    const email = source as SmtpQuerySpec;

    return {
      id: spec.actionId,
      ...buildSmtpActionDto(email, compileSmtpQuery(email)),
    };
  }

  const rest = source as RestApiSpec;
  const compiled = buildRestActionDto(rest, compileRestApi(rest));

  return { id: spec.actionId, ...compiled };
}

// Builds the minimal, safe patch request. The output keeps only the ActionDTO fields that the structured SQL, REST and
// SMTP compilers produce; it drops every other caller-controlled field. `options.dialect` is the family of the SQL
// datasource. The caller resolves it, and inList needs it.
export function buildUpdateActionDto(
  spec: UpdateActionSpec,
  options: CompileQueryOptions = {},
): UpdateActionRequest {
  return {
    actionId: spec.actionId,
    applicationId: spec.applicationId,
    revision: spec.revision,
    action: buildUpdateAction(spec, options),
  };
}

// Duplicate and delete preserve the stored action/datasource server-side. No action configuration is accepted here.
export function buildDuplicateActionDto(
  spec: DuplicateActionSpec,
): ActionLifecycleRequest & { kind: "SQL" | "REST" | "SMTP"; name: string } {
  return {
    actionId: spec.actionId,
    applicationId: spec.applicationId,
    revision: spec.revision,
    kind: spec.kind,
    name: spec.name,
  };
}

export interface CopyActionRequest extends ActionLifecycleRequest {
  name: string;
  target: { applicationId: string; pageId: string; datasourceId?: string };
}

export function buildCopyActionDto(spec: CopyActionSpec): CopyActionRequest {
  return {
    actionId: spec.actionId,
    applicationId: spec.applicationId,
    revision: spec.revision,
    name: spec.name,
    target: {
      applicationId: spec.target.applicationId,
      pageId: spec.target.pageId,
      ...(spec.target.datasourceId !== undefined
        ? { datasourceId: spec.target.datasourceId }
        : {}),
    },
  };
}

export function buildDeleteActionDto(
  spec: DeleteActionSpec,
): ActionLifecycleRequest {
  return {
    actionId: spec.actionId,
    applicationId: spec.applicationId,
    revision: spec.revision,
  };
}
