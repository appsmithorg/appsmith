import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeFactory";
import { dataTreeEvaluator } from "./handlers/evalTree";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import type { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import { makeEntityConfigsAsObjProperties } from "@appsmith/workers/Evaluation/dataTreeUtils";
import type { EvalTreeResponseData } from "./types";
import { MessageType, sendMessage } from "utils/MessageUtil";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import type { UpdateDataTreeMessageData } from "sagas/EvalWorkerActionSagas";
import type { JSUpdate } from "utils/JSPaneUtils";

export function evalTreeWithChanges(updatedValuePaths: string[][]) {
  let evalOrder: string[] = [];
  let jsUpdates: Record<string, JSUpdate> = {};
  let unEvalUpdates: DataTreeDiff[] = [];
  let nonDynamicFieldValidationOrder: string[] = [];
  const isCreateFirstTree = false;
  let dataTree: DataTree = {};
  const errors: EvalError[] = [];
  const logs: any[] = [];
  const dependencies: DependencyMap = {};
  let evalMetaUpdates: EvalMetaUpdates = [];
  let staleMetaIds: string[] = [];
  const pathsToClearErrorsFor: any[] = [];

  if (dataTreeEvaluator) {
    const setupUpdateTreeResponse =
      dataTreeEvaluator.setupUpdateTreeWithDifferences(updatedValuePaths);

    evalOrder = setupUpdateTreeResponse.evalOrder;
    unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;
    jsUpdates = setupUpdateTreeResponse.jsUpdates;

    nonDynamicFieldValidationOrder =
      setupUpdateTreeResponse.nonDynamicFieldValidationOrder;
    const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      dataTreeEvaluator.oldConfigTree,
      unEvalUpdates,
    );
    dataTree = makeEntityConfigsAsObjProperties(dataTreeEvaluator.evalTree, {
      evalProps: dataTreeEvaluator.evalProps,
    });
    evalMetaUpdates = JSON.parse(
      JSON.stringify(updateResponse.evalMetaUpdates),
    );
    staleMetaIds = updateResponse.staleMetaIds;
  }

  const evalTreeResponse: EvalTreeResponseData = {
    dataTree,
    dependencies,
    errors,
    evalMetaUpdates,
    evaluationOrder: evalOrder,
    jsUpdates,
    logs,
    unEvalUpdates,
    isCreateFirstTree,
    configTree: dataTreeEvaluator?.oldConfigTree as ConfigTree,
    staleMetaIds,
    pathsToClearErrorsFor,
    isNewWidgetAdded: false,
  };

  const data: UpdateDataTreeMessageData = {
    workerResponse: evalTreeResponse,
    unevalTree: dataTreeEvaluator?.getOldUnevalTree() as UnEvalTree,
  };

  sendMessage.call(self, {
    messageType: MessageType.DEFAULT,
    body: {
      data,
      method: MAIN_THREAD_ACTION.UPDATE_DATATREE,
    },
  });
}
