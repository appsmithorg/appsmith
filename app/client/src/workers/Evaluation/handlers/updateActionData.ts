import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerSyncRequest } from "../types";
import { set } from "lodash";
import { evalTreeWithChanges } from "../evalTreeWithChanges";

export interface UpdateActionProps {
  entityName: string;
  dataPath: string;
  data: unknown;
}
export default function (request: EvalWorkerSyncRequest) {
  const actionsDataToUpdate: UpdateActionProps[] = request.data;
  handleActionsDataUpdate(actionsDataToUpdate);
}

export function handleActionsDataUpdate(
  actionsToUpdate: UpdateActionProps[],
  pathsToSkipFromEval?: string[],
) {
  if (!dataTreeEvaluator) {
    return {};
  }
  const evalTree = dataTreeEvaluator.getEvalTree();

  for (const actionToUpdate of actionsToUpdate) {
    const { data, dataPath, entityName } = actionToUpdate;
    // update the evaltree
    set(evalTree, `${entityName}.[${dataPath}]`, data);
    // Update context
    set(self, `${entityName}.[${dataPath}]`, data);
  }
  const updatedProperties: string[][] = actionsToUpdate.map(
    ({ dataPath, entityName }) => [entityName, dataPath],
  );
  evalTreeWithChanges(updatedProperties, [], pathsToSkipFromEval);
}
