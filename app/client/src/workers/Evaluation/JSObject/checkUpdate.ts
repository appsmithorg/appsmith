import { Diff } from "deep-diff";
import {
  diffModifiedVariables,
  filterPatches,
  jsVariableUpdates,
} from "./JSVariableUpdates";
import { triggerEvalWithDataTreeDiff } from "./sendUpdatedDataTree";
import { DataTree } from "entities/DataTree/dataTreeFactory";

let registeredTask = false;

// executes when worker is idle
function checkForJsVariableUpdate() {
  const start = performance.now();
  const updates = jsVariableUpdates.getAll();
  const modifiedVariablesList = filterPatches(updates);
  const diffs = (diffModifiedVariables(
    modifiedVariablesList,
  ) as unknown) as Diff<DataTree, DataTree>[];

  if (diffs.length > 0) {
    // trigger evaluation
    triggerEvalWithDataTreeDiff(diffs);
  }
  jsVariableUpdates.clear();
  registeredTask = false;

  const end = performance.now();
  console.log("$$$-checkForJsVariableUpdate", end - start);
}

export function addJSUpdateCheckTaskInQueue() {
  if (!registeredTask) {
    registeredTask = true;
    queueMicrotask(() => {
      checkForJsVariableUpdate();
    });
  }
}
