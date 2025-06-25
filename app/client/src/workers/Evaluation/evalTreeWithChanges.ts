import { dataTreeEvaluator } from "./handlers/evalTree";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import type {
  EvalTreeResponseData,
  EvalWorkerSyncRequest,
  UpdateTreeResponse,
} from "./types";
import { MessageType, sendMessage } from "utils/MessageUtil";
import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import type { UpdateDataTreeMessageData } from "sagas/types";
import {
  generateOptimisedUpdatesAndSetPrevState,
  getNewDataTreeUpdates,
  uniqueOrderUpdatePaths,
  updateEvalProps,
} from "./helpers";
import {
  isDataPath,
  type DataTreeDiff,
} from "ee/workers/Evaluation/evaluationUtils";
import type DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import type { Diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { klona as klonaJson } from "klona/json";

const getDefaultEvalResponse = (): EvalTreeResponseData => ({
  updates: "[]",
  dependencies: {},
  errors: [],
  evalMetaUpdates: [],
  evaluationOrder: [],
  jsUpdates: {},
  logs: [],
  unEvalUpdates: [],
  isCreateFirstTree: false,
  staleMetaIds: [],
  removedPaths: [],
  isNewWidgetAdded: false,
  undefinedEvalValuesMap: {},
  jsVarsCreatedEvent: [],
  executeReactiveActions: [],
});

export function evalTreeWithChanges(
  request: EvalWorkerSyncRequest<{
    metaUpdates?: EvalMetaUpdates;
    updatedValuePaths: string[][];
  }>,
) {
  const { data } = request;
  const { metaUpdates = [], updatedValuePaths } = data;

  const unEvalTree = dataTreeEvaluator?.getEvalTree();
  const filteredUpdatedValuePaths = updatedValuePaths.filter((pathArr) => {
    if (pathArr[pathArr.length - 1] !== "data") return true;

    const fullPath = pathArr.join(".");

    const entityName = pathArr[0];
    const entity = unEvalTree?.[entityName];

    if (entity && isDataPath(entity, fullPath)) {
      return false; // filter out
    }

    return true; // keep for other entity types
  });

  const pathsToSkipFromEval = filteredUpdatedValuePaths.map((path) =>
    path.join("."),
  );

  let setupUpdateTreeResponse = {} as UpdateTreeResponse;
  let oldEvalTree: DataTree = {};

  if (dataTreeEvaluator) {
    oldEvalTree = klonaJson(dataTreeEvaluator.getEvalTree());
    setupUpdateTreeResponse = dataTreeEvaluator.setupUpdateTreeWithDifferences(
      updatedValuePaths,
      pathsToSkipFromEval,
    );
  }

  evaluateAndPushResponse(
    dataTreeEvaluator,
    setupUpdateTreeResponse,
    metaUpdates,
    pathsToSkipFromEval,
    oldEvalTree,
  );
}

export const getAffectedNodesInTheDataTree = (
  unEvalUpdates: DataTreeDiff[],
  evalOrder: string[],
) => {
  const allUnevalUpdates = unEvalUpdates.map(
    (update) => update.payload.propertyPath,
  );

  // merge unevalUpdate paths and evalOrder paths
  return uniqueOrderUpdatePaths([...allUnevalUpdates, ...evalOrder]);
};

export const evaluateAndPushResponse = (
  dataTreeEvaluator: DataTreeEvaluator | undefined,
  setupUpdateTreeResponse: UpdateTreeResponse,
  metaUpdates: EvalMetaUpdates,
  additionalPathsAddedAsUpdates: string[],
  oldEvalTree: DataTree,
) => {
  const response = evaluateAndGenerateResponse(
    dataTreeEvaluator,
    setupUpdateTreeResponse,
    metaUpdates,
    additionalPathsAddedAsUpdates,
    oldEvalTree,
  );

  return pushResponseToMainThread(response);
};

export const evaluateAndGenerateResponse = (
  dataTreeEvaluator: DataTreeEvaluator | undefined,
  setupUpdateTreeResponse: UpdateTreeResponse,
  metaUpdates: EvalMetaUpdates,
  additionalPathsAddedAsUpdates: string[],
  oldEvalTree: DataTree,
): UpdateDataTreeMessageData => {
  // generate default response first and later add updates to it
  const defaultResponse = getDefaultEvalResponse();

  if (!dataTreeEvaluator) {
    const updates = generateOptimisedUpdatesAndSetPrevState(
      {},
      dataTreeEvaluator,
      [],
      undefined,
      false,
    );

    defaultResponse.updates = updates;
    defaultResponse.evalMetaUpdates = [...(metaUpdates || [])];

    return {
      workerResponse: defaultResponse,
    };
  }

  const { evalOrder, jsUpdates, unEvalUpdates } = setupUpdateTreeResponse;

  defaultResponse.evaluationOrder = evalOrder;
  defaultResponse.unEvalUpdates = unEvalUpdates;
  defaultResponse.jsUpdates = jsUpdates;

  const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    dataTreeEvaluator.oldConfigTree,
    unEvalUpdates,
    [],
    oldEvalTree,
  );

  const dataTree = updateEvalProps(dataTreeEvaluator) || {};

  /** Make sure evalMetaUpdates is sanitized to prevent postMessage failure */
  defaultResponse.evalMetaUpdates = JSON.parse(
    JSON.stringify([...(metaUpdates || []), ...updateResponse.evalMetaUpdates]),
  );

  defaultResponse.staleMetaIds = updateResponse.staleMetaIds;
  defaultResponse.dependencies = dataTreeEvaluator.inverseDependencies;
  defaultResponse.executeReactiveActions =
    updateResponse.executeReactiveActions;

  // when additional paths are required to be added as updates, we extract the updates from the data tree using these paths.
  const additionalUpdates = getNewDataTreeUpdates(
    additionalPathsAddedAsUpdates,
    dataTree,
  ) as Diff<DataTree, DataTree>[];

  // the affected paths is a combination of the eval order and the uneval updates
  // we use this collection to limit the diff between the old and new data tree
  const affectedNodePaths = getAffectedNodesInTheDataTree(
    unEvalUpdates,
    evalOrder,
  );

  const updates = generateOptimisedUpdatesAndSetPrevState(
    dataTree,
    dataTreeEvaluator,
    affectedNodePaths,
    additionalUpdates,
    true,
  );

  defaultResponse.updates = updates;
  dataTreeEvaluator.undefinedEvalValuesMap =
    dataTreeEvaluator.undefinedEvalValuesMap || {};

  return {
    workerResponse: defaultResponse,
  };
};

export const pushResponseToMainThread = (data: UpdateDataTreeMessageData) => {
  sendMessage.call(self, {
    messageType: MessageType.DEFAULT,
    body: {
      data,
      method: MAIN_THREAD_ACTION.UPDATE_DATATREE,
    },
  });
};
