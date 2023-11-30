import type { Workflow as CE_Workflow } from "ce/constants/WorkflowConstants";

export type Workflow = CE_Workflow;

export type WorkflowMetadata = Pick<
  Workflow,
  "id" | "name" | "workspaceId" | "icon" | "color" | "modifiedAt" | "modifiedBy"
>;

export const DEFAULT_WORKFLOW_COLOR = "#9747FF1A";
// TODO (Workflows): Change icon to workflow
export const DEFAULT_WORKFLOW_ICON = "package";
export const DEFAULT_WORKFLOW_PREFIX = "Untitled Workflow ";
