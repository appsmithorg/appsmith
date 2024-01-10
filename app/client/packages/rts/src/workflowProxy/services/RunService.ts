import { Connection, Client } from "@temporalio/client";
import { executeWorkflow, resumeSignal } from "./workflows";
import { nanoid } from "nanoid";
import type { ExecuteInboxResolutionRequest } from "@workflowProxy/constants/types";
import { error } from "loglevel";

export interface RunRequest {
  reqHeaders: Record<string, any>; // headers from the request
  workflowId: string; // workflow id from appsmith editor
  workflowDef: string; // workflow code from appsmith editor
  actionMap: Record<string, string>; // map for actionName to actionId
  triggerData?: any; // webhook data to be passed to workflow
}

export interface RunResponse {
  success: boolean;
  message: string;
  workflowInstanceId?: string;
  data?: any;
}

// export const resumeSignal = defineSignal<[ExecuteInboxResolutionRequest]>("resumeSignal");

// Connections are expensive to construct and should be reused.
// Make sure to close any unused connections to avoid leaking resources.
class ConnectionSingleton {
  private static instance: Connection;

  private constructor() {}

  public static async getInstance(): Promise<Connection> {
    if (!ConnectionSingleton.instance) {
      // Connect to the default Server location

      ConnectionSingleton.instance = await Connection.connect({
        address: "localhost:7233",
      });
      // In production, pass options to configure TLS and other settings:
      // {
      //   address: 'foo.bar.tmprl.cloud',
      //   tls: {}
      // }
    }
    return ConnectionSingleton.instance;
  }
}

export class RunService {
  // Deploys the workflow to temporal
  // 1. Use input file to create a workflow file that can be deployed to temporal
  // 2. Deploy the workflow to temporal
  static async run(runRequest: RunRequest): Promise<RunResponse> {
    try {
      const temporalConnection = await ConnectionSingleton.getInstance();

      const temporalClient = new Client({
        connection: temporalConnection,
        namespace: "default", // connects to 'default' namespace if not specified
      });

      // in practice, use a meaningful business ID, like customerId or transactionId
      const workflowInstanceId = "workflowInstance-" + nanoid();
      await temporalClient.workflow.start(executeWorkflow, {
        taskQueue: "appsmith-queue",
        args: [runRequest, workflowInstanceId],
        workflowId: workflowInstanceId, // temporal workflowID is NOT same as the workflowId used in the java server and frontend.
      });

      const runResponse: RunResponse = {
        success: true,
        message: "Workflow instance started running succesfully",
        data: {
          workflowInstanceId: workflowInstanceId,
        },
      };

      return runResponse;
    } catch (err) {
      const runResponse: RunResponse = {
        success: false,
        message: "Workflow instance failed to start",
        data: { error: err.message },
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
