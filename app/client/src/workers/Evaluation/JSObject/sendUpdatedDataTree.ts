import { DataTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import { dataTreeEvaluator } from "../handlers/evalTree";
import { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import { makeEntityConfigsAsObjProperties } from "@appsmith/workers/Evaluation/dataTreeUtils";
import { EvalTreeResponseData } from "../types";

import { MessageType, sendMessage } from "utils/MessageUtil";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { UpdateDataTreeMessageData } from "sagas/EvalWorkerActionSagas";
import { JSUpdate } from "utils/JSPaneUtils";

export function triggerEvalWithPathsChanged(updatedValuePaths: string[][]) {
  let evalOrder: string[] = [];
  const jsUpdates: Record<string, JSUpdate> = {};
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
    const setupUpdateTreeResponse = dataTreeEvaluator?.setupUpdateTreeWithDifferences(
      updatedValuePaths,
    );

    evalOrder = setupUpdateTreeResponse.evalOrder;

    unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;

    nonDynamicFieldValidationOrder =
      setupUpdateTreeResponse.nonDynamicFieldValidationOrder;
    const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
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
    staleMetaIds,
    pathsToClearErrorsFor,
  };

  const data: UpdateDataTreeMessageData = {
    workerResponse: evalTreeResponse,
    unevalTree: dataTreeEvaluator?.oldUnEvalTree as UnEvalTree,
  };

  sendMessage.call(self, {
    messageType: MessageType.DEFAULT,
    body: {
      data,
      method: MAIN_THREAD_ACTION.UPDATE_DATATREE,
    },
  });
}
