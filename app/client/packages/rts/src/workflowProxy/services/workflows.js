// since temporal requires "require.resolve" to refer to the workflow definition file.
// So we will skip from  esbuild. And we need to copy it manually.

import {
  defineSignal,
  setHandler,
  condition,
  proxyActivities,
} from "@temporalio/workflow";

const { createWorkflowRequest, executeActivity } = proxyActivities({
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
  // TODO: Push to log file
  // console.log("inside resume handler !", body);
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
  const { actionMap, reqHeaders, triggerData, workflowDef, workflowId } =
    runRequest;

  // Attach the signal handler to the signal
  setHandler(resumeSignal, resumeHandler);

  // action map is an object with key as action name and value as action id
  // we need to transform it to an object with key as action name and value as action object
  // with id as one of the property
  const actionMapTransformed = Object.entries(actionMap).reduce(
    (acc, [key, value]) => {
      acc[key] = {
        actionId: value,
      };
      return acc;
    },
    {},
  );

  // define platform functions here
  const appsmith = {
    workflows: {
      assignRequest: async function (...args) {
        // TODO: Push to log file
        // console.log("inside assignRequest", args);
        await createWorkflowRequest(
          reqHeaders,
          workflowId,
          workflowInstanceId,
          args[0],
        );

        // TODO: Push to log file
        // console.log("waiting for approval !!", output);

        canResume = false;
        await condition(() => canResume);
        // TODO: Push to log file
        // console.log("resumeData !!", resumeData);
        return resumeData;
      },
    },
  };

  const actionNames = Object.keys(actionMapTransformed);
  const actionValues = Object.values(actionMapTransformed);
  const workTemplateArgNames = [...actionNames, "appsmith"];
  const workflowObjectGeneratorCode = `(${workTemplateArgNames.join(
    ",",
  )}) =>(${workflowDef})`;

  // TODO: Push to log file
  // console.log(
  //   "executeWorkflow - workflowObjectGeneratorCode",
  //   workflowObjectGeneratorCode,
  // );
  const workflowObjectGenerator = (0, eval)(workflowObjectGeneratorCode);

  const workflowObject = workflowObjectGenerator(...actionValues, appsmith);

  // Iterate all objects inside context and assign run function to it

  for (const actionName in actionMapTransformed) {
    // context[k].run = run.bind(context[k]);

    actionMapTransformed[actionName].run = async function (...args) {
      // TODO: Push to log file
      // console.log(
      //   "workflow-proxy inside actionMapTransformed.run",
      //   actionName,
      //   this.actionId,
      // );
      const output = await executeActivity(reqHeaders, this.actionId, args);

      // TODO: Push to log file
      // console.log("workflow-proxy activity data", output);

      this.data = output;
      return this.data;
    }.bind(actionMapTransformed[actionName]);
  }

  // TODO: Push to log file
  // console.log("inside executeWorkflow - triggerData !!", triggerData);
  // const status = await workflowObject.executeWorkflow(triggerData);
  await workflowObject.executeWorkflow(triggerData);

  // TODO: Push to log file
  // console.log("workflows.js > Workflow status: ", status);

  return true;
}
