import { Client, WorkflowIdReusePolicy } from "@temporalio/client";
import { executeWorkflow, resumeSignal } from "./workflows";
import type { ExecuteInboxResolutionRequest } from "@workflowProxy/constants/types";
import { error } from "loglevel";
import { ConnectionSingleton, generateWorkflowRunId } from "./utils";
import {
  WORKFLOW_NAMESPACE,
  WORKFLOW_TASK_QUEUE,
} from "@workflowProxy/constants/messages";

export interface RunRequest {
  reqHeaders: Record<string, any>; // headers from the request
  appsmithWorkflowId: string; // workflow id from appsmith editor
  workflowDef: string; // workflow code from appsmith editor
  actionMap: Record<string, string>; // map for actionName to actionId
  triggerData?: any; // webhook data to be passed to workflow
}

export interface RunResponse {
  success: boolean;
  message: string;
  workflowRunId?: string;
  data?: any;
}

//Remove export default
//This is required for temporal to understand the function
const jsObjectToCode = (script: string) => {
  return script.replace(/export default/g, "");
};

// Remove trailing comments from the input script
// This is required for temporal to understand the function
const removeComments = (script: string) => {
  return script.replace(/\/\/.*/g, "");
};

const sanitizeWorkflowDef = (workflowDef: string) => {
  return removeComments(jsObjectToCode(workflowDef));
};

export class RunService {
  // Deploys the workflow to temporal
  // 1. Use input file to create a workflow file that can be deployed to temporal
  // 2. Deploy the workflow to temporal
  static async run(runRequest: RunRequest): Promise<RunResponse> {
    try {
      const temporalConnection = await ConnectionSingleton.getInstance();

      const temporalClient = new Client({
        connection: temporalConnection,
        namespace: WORKFLOW_NAMESPACE,
      });

      const workflowRunId = generateWorkflowRunId();
      const { appsmithWorkflowId, workflowDef } = runRequest;
      const formattedWorkflowDef = sanitizeWorkflowDef(workflowDef);
      await temporalClient.workflow.start(executeWorkflow, {
        taskQueue: WORKFLOW_TASK_QUEUE,
        args: [
          { ...runRequest, workflowDef: formattedWorkflowDef },
          workflowRunId,
        ],
        workflowId: workflowRunId, // temporal workflowID is NOT same as the workflowId used in the java server and frontend.
        workflowIdReusePolicy:
          WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
        searchAttributes: {
          appsmithWorkflowId: [appsmithWorkflowId],
        },
      });

      const runResponse: RunResponse = {
        success: true,
        message: "Workflow run started succesfully",
        data: {
          workflowRunId: workflowRunId,
        },
      };

      return runResponse;
    } catch (err) {
      const runResponse: RunResponse = {
        success: false,
        message: "Workflow instance failed to start",
        data: err.message,
      };
      return runResponse;
    }
  }

  /**
   * Resumes a workflow that is waiting for a signal
   * @param body Contains workflowId, runId, requestId and resolution
   */
  static async executeInboxResolutionRequest(
    body: ExecuteInboxResolutionRequest,
  ) {
    try {
      const temporalConnection = await ConnectionSingleton.getInstance();

      const temporalClient = new Client({
        connection: temporalConnection,
        namespace: "default", // connects to 'default' namespace if not specified
      });

      const handle = temporalClient.workflow.getHandle(body.runId);

      // @ts-expect-error: resumeSignal expects the body to be passed as a parameter
      await handle.signal(resumeSignal, body);
    } catch (err) {
      error("Error while executing inbox resolution request", err);
    }
  }
}
