import { PlatformFunctions } from "@workflowProxy/constants/platformFunctions";
import type {
  ActivityOutput,
  ExecuteInboxCreationRequest as InboxCreationRequest,
} from "@workflowProxy/constants/types";

/**
 * Function to run activity in temporal can be either an appsmith query or inbox request
 * @param reqHeaders Headers from the request, to be passed to workflowProxy
 * @param workflowId Workflow id from appsmith editor
 * @param actionName Name of the action to be executed
 * @param actionId Id of the action to be executed
 * @param workflowInstanceId Run id of the workflow instance
 * @param userParams Params passed in workflow definition to the action
 * @returns output of the activity
 */
export async function runActivityInTemporal(
  reqHeaders: Record<string, any>,
  workflowId: string,
  actionName: string,
  actionId: string,
  workflowInstanceId: string,
  userParams: Array<Record<string, any>>,
) {
  let result: any;
  let output: ActivityOutput = { shallWaitForSignal: false, data: {} };

  if (actionName === PlatformFunctions.InboxApprovalRequest) {
    result = await executeCreateInboxRequest(
      reqHeaders,
      workflowId,
      workflowInstanceId,
      userParams[0],
    );

    output = { shallWaitForSignal: true, data: result.data };
  } else {
    // for others actions like Query, API etc
    result = await executeActivity(reqHeaders, actionId, {});
    output = { shallWaitForSignal: false, data: result.data };
  }

  return output;
}

/**
 *  Function to execute activity in workflowProxy, temporal will call this function
 * @param reqHeaders headers from the request, to be passed to workflowProxy
 * @param actionId Id of the action to be executed
 * @param userParams Params passed in workflow definition to the action
 * @returns Output of the activity
 */
async function executeActivity(
  reqHeaders: Record<string, any>,
  actionId: string,
  userParams: Record<string, any>,
) {
  return fetch(
    "http://localhost:8091/rts-api/v1/workflowProxy/executeActivity",
    {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({ actionId, userParams }),
    },
  )
    .then(async (response) => response.json())
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
async function executeCreateInboxRequest(
  reqHeaders: Record<string, any>,
  workflowId: string,
  workflowInstanceId: string,
  userParams: Record<string, any>,
) {
  // @ts-expect-error: userParams is has the pending approval details
  const body: InboxCreationRequest = {
    workflowId,
    runId: workflowInstanceId,
    ...userParams,
  };

  return fetch("http://localhost:8091/rts-api/v1/workflowProxy/approvalInbox", {
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
