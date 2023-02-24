import { updateEvalTreeValueFromContext } from ".";
import JSVariableUpdates, { getModifiedPaths } from "./JSVariableUpdates";
import { triggerEvalWithPathsChanged } from "./sendUpdatedDataTree";

let registeredTask = false;

// executes when worker is idle
function checkForJsVariableUpdate() {
  console.log("$$$-TASK EXECUTION STARTED");

  const updates = JSVariableUpdates.getAll();
  const modifiedVariablesList = getModifiedPaths(updates);
  updateEvalTreeValueFromContext(modifiedVariablesList);

  if (modifiedVariablesList.length > 0) {
    // trigger evaluation
    triggerEvalWithPathsChanged(modifiedVariablesList);
  }
  JSVariableUpdates.clear();
  registeredTask = false;
  console.log("$$$-TASK EXECUTION COMPLETED", modifiedVariablesList);
}

export function registerJSUpdateCheckTask(task = checkForJsVariableUpdate) {
  if (!registeredTask) {
    registeredTask = true;
    queueMicrotask(task);
  }
}
