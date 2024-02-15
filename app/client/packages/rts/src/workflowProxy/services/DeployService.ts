import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";

export interface DeployRequest {
  workflowCode: string; // workflow code from appsmith editor
  actionMap: Record<string, string>; // map for actionName to actionId
  workflowId: string; // workflow id from appsmith editor
}

export interface DeployResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class DeployService {
  static async createWorker() {
    try {
      // Step 1: Establish a connection with Temporal server.
      //
      // Worker code uses `@temporalio/worker.NativeConnection`.
      // (But in your application code it's `@temporalio/client.Connection`.)
      const connection = await NativeConnection.connect({
        address: "localhost:7233",
        // TLS and gRPC metadata configuration goes here.
      });
      // Step 2: Register Workflows and Activities with the Worker.
      const worker = await Worker.create({
        connection,
        namespace: "default",
        taskQueue: "appsmith-queue",
        // Workflows are registered using a path as they run in a separate JS context.
        // workflowsPath: require.resolve('./workflows.js'),
        // workflowsPath: '/media/workdir/workflow/temporal/node-proxy-temporal/src/workflowProxy/services/temp/workflows-autogen.js',
        // workflowsPath: require.resolve('./workflows.js'),
        workflowsPath: require.resolve("./workflows.js"),

        activities,
      });

      // Step 3: Start accepting tasks on the `appsmith-queue` queue
      //
      // The worker runs until it encounters an unexepected error or the process receives a shutdown signal registered on
      // the SDK Runtime object.
      //
      // By default, worker logs are written via the Runtime logger to STDERR at INFO level.
      //
      // See https://typescript.temporal.io/api/classes/worker.Runtime#install to customize these defaults.
      await worker.run();
    } catch (err) {
      // TODO: handle error gracefully
      return;
    }
  }
}
