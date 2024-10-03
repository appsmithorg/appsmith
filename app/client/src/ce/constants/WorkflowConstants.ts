import type { EvaluationVersion } from "constants/EvalConstants";

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
  // Evaluation version of the application. Used to ensure the escape characters are properly evaluated.
  // PR for reference: https://github.com/appsmithorg/appsmith/pull/8796
  evaluationVersion: EvaluationVersion;
  token?: string;
}

export type WorkflowMetadata = Workflow;
