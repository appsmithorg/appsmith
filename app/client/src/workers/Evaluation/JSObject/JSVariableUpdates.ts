import { dataTreeEvaluator } from "../handlers/evalTree";
import { isJSAction } from "ce/workers/Evaluation/evaluationUtils";
import { updateEvalTreeValueFromContext } from ".";
import { evalTreeWithChanges } from "../evalTreeWithChanges";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { get, set } from "lodash";

export enum PatchType {
  "PROTOTYPE_METHOD_CALL" = "PROTOTYPE_METHOD_CALL",
  "DELETE" = "DELETE",
  "SET" = "SET",
}

export type Patch = {
  path: string;
  method: PatchType;
  value?: unknown;
};

class JSVariableUpdates {
  private static patches: Patch[] = [];

  static add(patch: Patch) {
    if (ExecutionMetaData.getExecutionMetaData().jsVarUpdateTrackingDisabled)
      return;
    this.patches.push(patch);
    /**
     *  For every update on variable, we register a task to check for update updates and apply
     *  them to eval tree.
     */
    registerJSVarUpdateTask();
  }

  static getAll() {
    return this.patches;
  }

  static clear() {
    this.patches = [];
  }
}

export default JSVariableUpdates;

export function getUpdatedPaths(patches: Patch[]) {
  // store exact path to diff
  const updatedVariables = [];
  const pushedPathsMap: Record<string, string> = {};
  for (const patch of patches) {
    const pathArray = patch.path.split(".");
    const [jsObjectName, varName] = pathArray;

    if (!dataTreeEvaluator) continue;

    const configTree = dataTreeEvaluator?.oldConfigTree;
    const entityConfig = configTree[jsObjectName] as unknown as DataTreeEntity;
    if (!isJSAction(entityConfig)) continue;
    const variables = entityConfig.variables;
    if (
      variables.includes(varName) &&
      !get(pushedPathsMap, [jsObjectName, varName])
    ) {
      updatedVariables.push([jsObjectName, varName]);
      set(
        pushedPathsMap,
        [jsObjectName, varName],
        `${jsObjectName}.${varName}`,
      );
    }
  }
  return updatedVariables;
}

let jsVarUpdateTaskRegistered = false;

// executes when worker is idle
function applyJSVariableUpdatesToEvalTree() {
  const updates = JSVariableUpdates.getAll();
  const modifiedVariablesList = getUpdatedPaths(updates);

  updateEvalTreeValueFromContext(modifiedVariablesList);

  if (modifiedVariablesList.length > 0) {
    evalTreeWithChanges(modifiedVariablesList);
  }
  JSVariableUpdates.clear();
  jsVarUpdateTaskRegistered = false;
}

export function registerJSVarUpdateTask(
  task = applyJSVariableUpdatesToEvalTree,
) {
  if (!jsVarUpdateTaskRegistered) {
    jsVarUpdateTaskRegistered = true;
    queueMicrotask(task);
  }
}
