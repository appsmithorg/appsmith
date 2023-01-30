import {
  diffModifiedVariables,
  filterPatches,
  jsVariableUpdates,
} from "./JSVariableUpdates";

// executes when worker is idle
function checkForJsVariableUpdate() {
  const updates = jsVariableUpdates.getAll();
  const modifiedVariablesList = filterPatches(updates);
  const diffs = diffModifiedVariables(modifiedVariablesList);

  if (diffs.length > 0) {
    // trigger eval
    // setupUpdateTree()
  }
}

export function triggerMicrotask() {
  queueMicrotask(() => {
    checkForJsVariableUpdate();
  });
}
