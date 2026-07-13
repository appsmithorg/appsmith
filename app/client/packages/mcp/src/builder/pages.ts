import { z } from "zod";

const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const APP_OR_PAGE_ID = /^[A-Za-z0-9]{24,50}$/;
const PAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;
const REVISION = /^[a-f0-9]{64}$/;

const identifier = z
  .string()
  .regex(APP_OR_PAGE_ID, "must be a 24-50 character Appsmith identifier");
const revision = z
  .string()
  .regex(REVISION, "must be a SHA-256 revision token");
const pageName = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .regex(PAGE_NAME, "must use safe letters, numbers, spaces, underscores, or hyphens")
  .refine(
    (value) => !RAW_EXPRESSION.test(value),
    "must not contain binding or template syntax",
  );

const pageReferenceSchema = z
  .object({
    applicationId: identifier,
    pageId: identifier,
    revision,
  })
  .strict();

// PageCreationDTO requires a non-empty layouts list. This closed, compiler-owned canvas is the equivalent of the
// platform's blank-page template; callers cannot provide DSL, bindings, actions, or arbitrary page configuration.
function buildBlankPageDsl(): Record<string, unknown> {
  return {
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 1242,
    snapColumns: 64,
    widgetId: "0",
    topRow: 0,
    bottomRow: 1292,
    parentRowSpace: 1,
    type: "CANVAS_WIDGET",
    detachFromLayout: true,
    minHeight: 1292,
    dynamicBindingPathList: {},
    parentColumnSpace: 1,
    leftColumn: 0,
    children: [],
  };
}

export const createPageSpecSchema = z
  .object({
    applicationId: identifier,
    revision,
    name: pageName,
  })
  .strict();

export const renamePageSpecSchema = pageReferenceSchema
  .extend({ name: pageName })
  .strict();

// Delete has no optional caller-controlled fields and is deliberately separate from the non-destructive request
// union, allowing the caller to require a governance confirmation before invoking the Page API.
export const deletePageSpecSchema = pageReferenceSchema;

export type CreatePageSpec = z.infer<typeof createPageSpecSchema>;
export type RenamePageSpec = z.infer<typeof renamePageSpecSchema>;
export type DeletePageSpec = z.infer<typeof deletePageSpecSchema>;

export interface PageMutationRequest {
  applicationId: string;
  revision: string;
  method: "POST" | "PUT";
  path: string;
  body: Record<string, unknown>;
  destructive: false;
}

export interface DeletePageRequest {
  applicationId: string;
  pageId: string;
  revision: string;
  method: "DELETE";
  path: string;
  destructive: true;
  confirmation: {
    operation: "delete_page";
    entityKey: string;
  };
}

// The revision is MCP orchestration metadata, not an undocumented Page API field. Callers must compare it with
// their current application/page revision before dispatching this request.
export function buildCreatePageRequest(
  spec: CreatePageSpec,
): PageMutationRequest {
  return {
    applicationId: spec.applicationId,
    revision: spec.revision,
    method: "POST",
    path: "v1/pages",
    body: {
      applicationId: spec.applicationId,
      name: spec.name,
      layouts: [{ dsl: buildBlankPageDsl(), layoutOnLoadActions: [] }],
    },
    destructive: false,
  };
}

export function buildRenamePageRequest(
  spec: RenamePageSpec,
): PageMutationRequest {
  return {
    applicationId: spec.applicationId,
    revision: spec.revision,
    method: "PUT",
    path: `v1/pages/${spec.pageId}`,
    body: { name: spec.name },
    destructive: false,
  };
}

export function buildDeletePageRequest(
  spec: DeletePageSpec,
): DeletePageRequest {
  return {
    applicationId: spec.applicationId,
    pageId: spec.pageId,
    revision: spec.revision,
    method: "DELETE",
    path: `v1/pages/${spec.pageId}`,
    destructive: true,
    confirmation: {
      operation: "delete_page",
      entityKey: `page:${spec.pageId}`,
    },
  };
}
