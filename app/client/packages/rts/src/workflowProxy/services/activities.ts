import { RTS_BASE_API_URL } from "@constants/routes";
import type { ExecuteInboxCreationRequest as InboxCreationRequest } from "@workflowProxy/constants/types";
import {
  EXECUTE_ENDPOINT,
  INBOX_REQUEST_ENDPOINT,
} from "@workflowProxy/routes";
import { log } from "loglevel";

/**
 *  Function to execute activity in workflowProxy, temporal will call this function
 * @param reqHeaders headers from the request, to be passed to workflowProxy
 * @param actionId Id of the action to be executed
 * @param inputParams Params passed in workflow definition to the action
 * @returns Output of the activity
 */
export async function executeActivity(
  reqHeaders: Record<string, any>,
  actionId: string,
  inputParams: Array<Record<string, any>>,
) {
  log("executeActivity", actionId, inputParams);
  return await fetch(`${RTS_BASE_API_URL}${EXECUTE_ENDPOINT}`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({ actionId, inputParams }),
  })
    .then(async (response) => await response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      return error;
    });
}

/**
 *  Create inbox request in workflowProxy, temporal will call this function
 * @param reqHeaders Headers from the request, to be passed to workflowProxy
 * @param workflowId Workflow id from appsmith editor
 * @param workflowInstanceId Run id of the workflow instance
 * @param userParams Params passed in workflow definition to the action
 * @returns Output of the activity
 */
export async function createWorkflowRequest(
  reqHeaders: Record<string, any>,
  workflowId: string,
  workflowInstanceId: string,
  userParams: Record<string, any>,
) {
  log("executeCreateInboxRequest", userParams, workflowInstanceId, workflowId);
  // @ts-expect-error: userParams is has the pending approval details
  const body: InboxCreationRequest = {
    workflowId,
    runId: workflowInstanceId,
    allowedResolutions: !!userParams.allowedResolutions
      ? userParams.allowedResolutions
      : ["Approve", "Reject"],
    ...userParams,
  };
  return await fetch(`${RTS_BASE_API_URL}${INBOX_REQUEST_ENDPOINT}`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify(body),
  })
    .then(async (response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      return error;
    });
}
