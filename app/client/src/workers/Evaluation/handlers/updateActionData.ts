import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerSyncRequest } from "../types";
import set from "lodash/set";
import { evalTreeWithChanges } from "../evalTreeWithChanges";
import DataStore from "../dataStore";

export interface UpdateActionProps {
  entityName: string;
  dataPath: string;
  data: unknown;
  dataPathRef?: string;
}
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
    DataStore.setActionData(`${entityName}.${dataPath}`, data);
  }
  const updatedProperties: string[][] = actionsToUpdate.map(
    ({ dataPath, entityName }) => [entityName, dataPath],
  );
  evalTreeWithChanges(updatedProperties, []);
}
