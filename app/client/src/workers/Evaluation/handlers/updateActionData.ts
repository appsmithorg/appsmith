import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerSyncRequest } from "../types";
import { set } from "lodash";
import { evalTreeWithChanges } from "../evalTreeWithChanges";
import DataStore from "../dataStore";
import { EVAL_WORKER_SYNC_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { UpdateActionProps } from "./types";

export default function (request: EvalWorkerSyncRequest) {
  const actionsDataToUpdate: UpdateActionProps[] = request.data;

  handleActionsDataUpdate(actionsDataToUpdate);

  return true;
}

export function handleActionsDataUpdate(actionsToUpdate: UpdateActionProps[]) {
  if (!dataTreeEvaluator) {
    return {};
  }

  const evalTree = dataTreeEvaluator.getEvalTree();

  updateActionsToEvalTree(evalTree, actionsToUpdate);

  const updatedProperties: string[][] = [];

  actionsToUpdate.forEach(({ dataPath, entityName }) => {
    updatedProperties.push([entityName, dataPath]);
  });
  evalTreeWithChanges({
    data: {
      updatedValuePaths: updatedProperties,
      metaUpdates: [],
    },
    method: EVAL_WORKER_SYNC_ACTION.EVAL_TREE_WITH_CHANGES,
    webworkerTelemetry: {},
  });
}

export function updateActionsToEvalTree(
  evalTree: DataTree,
  actionsToUpdate?: UpdateActionProps[],
) {
  if (!actionsToUpdate) return;

  for (const actionToUpdate of actionsToUpdate) {
    const { dataPath, dataPathRef, entityName } = actionToUpdate;
    let { data } = actionToUpdate;

    if (dataPathRef) {
      data = DataStore.getActionData(dataPathRef);
      DataStore.deleteActionData(dataPathRef);
    }

    // update the evaltree
    set(evalTree, `${entityName}.[${dataPath}]`, data);
    // Update context
    set(self, `${entityName}.[${dataPath}]`, data);
    // Update the datastore
    const path = `${entityName}.${dataPath}`;

    DataStore.setActionData(path, data);
  }
}
