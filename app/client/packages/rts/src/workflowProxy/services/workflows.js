// since temporal requires "require.resolve" to refer to the workflow definition file.
// So we will skip from  esbuild. And we need to copy it manually.

import {
  defineSignal,
  setHandler,
  condition,
  proxyActivities,
} from "@temporalio/workflow";

const { runActivityInTemporal } = proxyActivities({
  startToCloseTimeout: "1 minute",
});

// Define a signal that the workflow will use to resume execution
export const resumeSignal = defineSignal("resumeSignal");

// This variable will determine when the workflow should resume
let canResume = false;
let resumeData = {};

/**
 * Resume handler for the signal. This will be called when the signal is received by PUT /approvalInbox
 * @param {ExecuteInboxResolutionRequest} body Body with the resume signal
 */
function resumeHandler(body) {
  canResume = true;
  resumeData = {
    workflowInstanceId: body.runId,
    resolution: body.resolution,
    payload: body?.payload,
  };
}

/**
 * Function shell passed to temporal. Once a trigger comes in, the definition is passed via the runRequest object.
 * @param {RunRequest} runRequest Request object to run the workflow
 * @param {string} workflowInstanceId RunId of the workflow instance
 * @returns
 */
export async function executeWorkflow(runRequest, workflowInstanceId) {
  const { actionMap, data, reqHeaders, workflowDef, workflowId } = runRequest;

  // Attach the signal handler to the signal
  setHandler(resumeSignal, resumeHandler);

  const workflowObjectGeneratorCode = `(${Object.keys(actionMap).join(
    ",",
  )}) =>(${workflowDef})`;
  const workflowObjectGenerator = eval(workflowObjectGeneratorCode);

  const workflowObject = workflowObjectGenerator(
    ...Object.values(actionMap),
    data,
  );

  // Iterate all objects inside context and assign run function to it

  for (const actionName in actionMap) {
    // In appsmith, all output is stored in data object, this assignment is to make it work
    actionMap[actionName].data = {};

    // In appsmith, all functions are used with funcName.run(), this assignment is to make it work
    actionMap[actionName].run = async function (...args) {
      const output = await runActivityInTemporal(
        reqHeaders,
        workflowId,
        actionName,
        this.actionId,
        workflowInstanceId,
        args,
      );

      if (output.shallWaitForSignal === true) {
        canResume = false;
        this.data = output.data;
        await condition(() => canResume);
        this.data = resumeData;
      } else {
        this.data = output.data;
      }

      return this.data;
    };
  }

  // Execute the workflow
  await workflowObject.executeWorkflow();

  // Return true to indicate that the workflow has completed
  return true;
}
