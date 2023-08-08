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
import { setEvalContext } from "./evaluate";

export function evalTreeWithChanges(
  updatedValuePaths: string[][],
  metaUpdates: EvalMetaUpdates = [],
) {
  let evalOrder: string[] = [];
  let reValidatedPaths: string[] = [];
  let jsUpdates: Record<string, JSUpdate> = {};
  let unEvalUpdates: DataTreeDiff[] = [];
  let nonDynamicFieldValidationOrder: string[] = [];
  const isCreateFirstTree = false;
  let dataTree: DataTree = {};
  const errors: EvalError[] = [];
  const logs: any[] = [];
  const dependencies: DependencyMap = {};
  let evalMetaUpdates: EvalMetaUpdates = [...metaUpdates];
  let staleMetaIds: string[] = [];
  const removedPaths: Array<{ entityId: string; fullpath: string }> = [];
  let unevalTree: UnEvalTree = {};
  let configTree: ConfigTree = {};

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

    reValidatedPaths = updateResponse.reValidatedPaths;

    setEvalContext({
      dataTree: dataTreeEvaluator.getEvalTree(),
      configTree: dataTreeEvaluator.getConfigTree(),
      isDataField: false,
      isTriggerBased: true,
    });

    dataTree = makeEntityConfigsAsObjProperties(dataTreeEvaluator.evalTree, {
      evalProps: dataTreeEvaluator.evalProps,
    });

    evalMetaUpdates = [...evalMetaUpdates, ...updateResponse.evalMetaUpdates];

    staleMetaIds = updateResponse.staleMetaIds;
    unevalTree = dataTreeEvaluator.getOldUnevalTree();
    configTree = dataTreeEvaluator.oldConfigTree;
  }

  const evalTreeResponse: EvalTreeResponseData = {
    dataTree,
    dependencies,
    errors,
    evalMetaUpdates,
    evaluationOrder: evalOrder,
    reValidatedPaths,
    jsUpdates,
    logs,
    unEvalUpdates,
    isCreateFirstTree,
    configTree,
    staleMetaIds,
    removedPaths,
    isNewWidgetAdded: false,
    undefinedEvalValuesMap: dataTreeEvaluator?.undefinedEvalValuesMap || {},
    jsVarsCreatedEvent: [],
  };

  const data: UpdateDataTreeMessageData = {
    workerResponse: evalTreeResponse,
    unevalTree,
  };

  sendMessage.call(self, {
    messageType: MessageType.DEFAULT,
    body: {
      data,
      method: MAIN_THREAD_ACTION.UPDATE_DATATREE,
    },
  });
}
