import { promisify } from "workers/Evaluation/fns/utils/Promisify";

export interface WorkflowPayload {
  requestName: string;
  resolutions: string[];
  requestToUsers: string[];
  requestToGroups: string[];
  message: string;
  metadata: Record<string, unknown>;
}

function workflowAssignRequestFnDescriptor(payload: WorkflowPayload) {
  return {
    type: "ASSIGN_REQUEST" as const,
    payload,
  };
}

export type TWorkflowsAssignRequestDescription = ReturnType<
  typeof workflowAssignRequestFnDescriptor
>;
export type TWorkflowsAssignRequestActionType =
  TWorkflowsAssignRequestDescription["type"];

export async function workflowsAssignRequest(payload: WorkflowPayload) {
  const executor = promisify(workflowAssignRequestFnDescriptor);
  let response;
  try {
    response = await executor(payload);
  } catch (e) {
    throw e;
  }
  return response;
}
