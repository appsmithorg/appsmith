type ID = string;

export interface Workflow {
  id: ID;
  name: string; // Name of the workflow.
  icon: string;
  color: string;
  workspaceId: ID; // ID of the workspace where the workflow is created.
  modifiedBy: string;
  modifiedAt: string;
  userPermissions: string[];
}

export type WorkflowMetadata = Workflow;
