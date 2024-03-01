import { RTS_BASE_API_URL } from "@constants/routes";
import type { WorkflowRequestCreationPayload } from "@workflowProxy/constants/types";
import {
  EXECUTE_ENDPOINT,
  ASSIGN_REQUEST_ENDPOINT,
} from "@workflowProxy/routes";
import { log } from "loglevel";

const generateHeadersFromIncomingHeaders = (
  incomingHeaders: Record<string, any>,
) => {
  const outputHeaders: Record<string, any> = {};
  if (!!incomingHeaders["cookie"]) {
    outputHeaders["cookie"] = incomingHeaders["cookie"];
  }

  if (!!incomingHeaders["authorization"]) {
    outputHeaders["authorization"] = incomingHeaders["authorization"];
  }
  return outputHeaders;
};

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
  const headers = {
    ...generateHeadersFromIncomingHeaders(reqHeaders),
    "content-type": "application/json",
    Accept: "application/json",
  };

  return await fetch(`${RTS_BASE_API_URL}${EXECUTE_ENDPOINT}`, {
    method: "POST",
    mode: "cors",
    headers,
    body: JSON.stringify({ actionId, inputParams }),
  })
    .then(async (response) => await response.json())
    .then((data) => {
      return data.data.body;
    })
    .catch((error) => {
      return error;
    });
}

/**
 *  Create inbox request in workflowProxy, temporal will call this function
 * @param reqHeaders Headers from the request, to be passed to workflowProxy
 * @param appsmithWorkflowId Workflow id from appsmith editor
 * @param workflowRunId Run id of the workflow instance
 * @param userParams Params passed in workflow definition to the action
 * @returns Output of the activity
 */
export async function createWorkflowRequest(
  reqHeaders: Record<string, any>,
  appsmithWorkflowId: string,
  workflowRunId: string,
  userParams: Record<string, any>,
) {
  log(
    "executeCreateInboxRequest",
    userParams,
    workflowRunId,
    appsmithWorkflowId,
  );
  const headers = {
    ...generateHeadersFromIncomingHeaders(reqHeaders),
    "content-type": "application/json",
    Accept: "application/json",
  };
  // @ts-expect-error: userParams is has the pending approval details
  const body: WorkflowRequestCreationPayload = {
    workflowId: appsmithWorkflowId,
    runId: workflowRunId,
    ...userParams,
  };
  return await fetch(`${RTS_BASE_API_URL}${ASSIGN_REQUEST_ENDPOINT}`, {
    method: "POST",
    headers,
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
