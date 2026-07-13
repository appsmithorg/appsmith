import { z } from "zod";
import {
  buildActionDto,
  compileQuery,
  querySpecSchema,
  type QuerySpec,
} from "./query.js";
import {
  buildRestActionDto,
  compileRestApi,
  restApiSpecSchema,
  type RestApiSpec,
} from "./restApi.js";

// Lifecycle operations identify an already stored action. They deliberately have no escape hatch for inline
// datasource settings, raw SQL, or arbitrary action configuration.
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const identifier = z
  .string()
  .min(1)
  .max(128)
  .refine((value) => !RAW_EXPRESSION.test(value), "must not contain template syntax");
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

export const updateActionSpecSchema = z
  .union([sqlUpdateSchema, restUpdateSchema])
  .superRefine((spec, context) => {
    const source = spec.kind === "SQL" ? spec.query : spec.rest;

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
        path: [spec.kind === "SQL" ? "query" : "rest", "applicationId"],
        message: "must match the action applicationId",
      });
    }

    if (spec.name !== undefined && source.name !== spec.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [spec.kind === "SQL" ? "query" : "rest", "name"],
        message: "must match the update name",
      });
    }
  });

export const duplicateActionSpecSchema = actionReferenceSchema
  .extend({
    kind: z.enum(["SQL", "REST"]),
    name: actionName,
  })
  .strict();

// Deletion intentionally has no optional fields: the application/revision pair is required for optimistic
// concurrency, while the stored action ID is the only action identifier the caller may supply.
export const deleteActionSpecSchema = actionReferenceSchema;

export type UpdateActionSpec = z.infer<typeof updateActionSpecSchema>;
export type DuplicateActionSpec = z.infer<typeof duplicateActionSpecSchema>;
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
): Record<string, unknown> {
  const source = spec.kind === "SQL" ? spec.query : spec.rest;
  const action: Record<string, unknown> = { id: spec.actionId };
  const name = spec.name ?? source?.name;

  if (name !== undefined) action.name = name;
  if (!source) return action;

  if (spec.kind === "SQL") {
    const query = source as QuerySpec;
    const body = compileQuery(query);
    const compiled = buildActionDto(query, body);

    return { id: spec.actionId, ...compiled };
  }

  const rest = source as RestApiSpec;
  const compiled = buildRestActionDto(rest, compileRestApi(rest));

  return { id: spec.actionId, ...compiled };
}

// Builds the minimal, safe patch request. The output excludes every caller-controlled field except the closed
// ActionDTO vocabulary produced by the structured SQL/REST compilers.
export function buildUpdateActionDto(spec: UpdateActionSpec): UpdateActionRequest {
  return {
    actionId: spec.actionId,
    applicationId: spec.applicationId,
    revision: spec.revision,
    action: buildUpdateAction(spec),
  };
}

// Duplicate and delete preserve the stored action/datasource server-side. No action configuration is accepted here.
export function buildDuplicateActionDto(
  spec: DuplicateActionSpec,
): ActionLifecycleRequest & { kind: "SQL" | "REST"; name: string } {
  return {
    actionId: spec.actionId,
    applicationId: spec.applicationId,
    revision: spec.revision,
    kind: spec.kind,
    name: spec.name,
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
