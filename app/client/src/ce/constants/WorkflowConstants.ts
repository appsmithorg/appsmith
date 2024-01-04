type ID = string;

// Type for the workflow object.
export interface Workflow {
  id: ID;
  name: string; // Name of the workflow.
  icon: string;
  color: string;
  workspaceId: ID; // ID of the workspace where the workflow is created.
  modifiedBy: string;
  modifiedAt: string;
  userPermissions: string[];
  new: boolean;
  slug: string; // Slug of the workflow (Not in use currently).
  mainJsObjectId: string; // ID of the main JS object.
  tokenGenerated: boolean;
  token?: string;
}

export type WorkflowMetadata = Workflow;
