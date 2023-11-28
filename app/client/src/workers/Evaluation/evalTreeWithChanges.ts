import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
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
import { generateOptimisedUpdatesAndSetPrevState } from "./helpers";

export function evalTreeWithChanges(
  updatedValuePaths: string[][],
  metaUpdates: EvalMetaUpdates = [],
) {
  let evalOrder: string[] = [];
  let jsUpdates: Record<string, JSUpdate> = {};
  let unEvalUpdates: DataTreeDiff[] = [];
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

    const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
      evalOrder,
      dataTreeEvaluator.oldConfigTree,
      unEvalUpdates,
    );

    dataTree = makeEntityConfigsAsObjProperties(dataTreeEvaluator.evalTree, {
      evalProps: dataTreeEvaluator.evalProps,
      identicalEvalPathsPatches:
        dataTreeEvaluator.getEvalPathsIdenticalToState(),
    });

    /** Make sure evalMetaUpdates is sanitized to prevent postMessage failure */
    evalMetaUpdates = JSON.parse(
      JSON.stringify([...evalMetaUpdates, ...updateResponse.evalMetaUpdates]),
    );

    staleMetaIds = updateResponse.staleMetaIds;
    unevalTree = dataTreeEvaluator.getOldUnevalTree();
    configTree = dataTreeEvaluator.oldConfigTree;
  }

  const updates = generateOptimisedUpdatesAndSetPrevState(
    dataTree,
    dataTreeEvaluator,
  );
  const evalTreeResponse: EvalTreeResponseData = {
    updates,
    dependencies,
    errors,
    evalMetaUpdates,
    evaluationOrder: evalOrder,
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
