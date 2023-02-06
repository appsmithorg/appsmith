import { Diff } from "deep-diff";
import {
  diffModifiedVariables,
  filterPatches,
  jsVariableUpdates,
} from "./JSVariableUpdates";
import { triggerEvalWithDataTreeDiff } from "./sendUpdatedDataTree";
import { DataTree } from "entities/DataTree/dataTreeFactory";

// executes when worker is idle
function checkForJsVariableUpdate() {
  const updates = jsVariableUpdates.getAll();
  const modifiedVariablesList = filterPatches(updates);
  const diffs = (diffModifiedVariables(
    modifiedVariablesList,
  ) as unknown) as Diff<DataTree, DataTree>[];

  if (diffs.length > 0) {
    // trigger evaluation
    triggerEvalWithDataTreeDiff(diffs);
    jsVariableUpdates.clear();
  }
}

export function addJSUpdateCheckTaskInQueue() {
  queueMicrotask(() => {
    checkForJsVariableUpdate();
  });
}
