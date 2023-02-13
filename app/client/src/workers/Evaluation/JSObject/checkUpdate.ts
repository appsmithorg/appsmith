import { getModifiedPaths, jsVariableUpdates } from "./JSVariableUpdates";
import { triggerEvalWithPathsChanged } from "./sendUpdatedDataTree";

let registeredTask = false;

// executes when worker is idle
function checkForJsVariableUpdate() {
  const updates = jsVariableUpdates.getAll();
  const modifiedVariablesList = getModifiedPaths(updates);

  if (modifiedVariablesList.length > 0) {
    // trigger evaluation
    triggerEvalWithPathsChanged(modifiedVariablesList);
  }
  jsVariableUpdates.clear();
  registeredTask = false;
}

export function addJSUpdateCheckTaskInQueue() {
  if (!registeredTask) {
    registeredTask = true;
    queueMicrotask(() => {
      checkForJsVariableUpdate();
    });
  }
}
