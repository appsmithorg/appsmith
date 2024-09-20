import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import type ReplayEntity from "entities/Replay";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import { isEmpty } from "lodash";
import type { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import type { JSUpdate } from "utils/JSPaneUtils";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import { makeEntityConfigsAsObjProperties } from "ee/workers/Evaluation/dataTreeUtils";
import type { DataTreeDiff } from "ee/workers/Evaluation/evaluationUtils";
import { serialiseToBigInt } from "ee/workers/Evaluation/evaluationUtils";
import {
  CrashingError,
  getSafeToRenderDataTree,
} from "ee/workers/Evaluation/evaluationUtils";
import type { EvalTreeRequestData, EvalWorkerASyncRequest } from "../types";
import { clearAllIntervals } from "../fns/overrides/interval";
import JSObjectCollection from "workers/Evaluation/JSObject/Collection";
import { getJSVariableCreatedEvents } from "../JSObject/JSVariableEvents";
import { errorModifier } from "../errorModifier";
import {
  generateOptimisedUpdatesAndSetPrevState,
  uniqueOrderUpdatePaths,
} from "../helpers";
import DataStore from "../dataStore";
import type { TransmissionErrorHandler } from "../fns/utils/Messenger";
import { MessageType, sendMessage } from "utils/MessageUtil";
import {
  profileFn,
  newWebWorkerSpanData,
  profileAsyncFn,
} from "UITelemetry/generateWebWorkerTraces";
import type { SpanAttributes } from "UITelemetry/generateTraces";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let replayMap: Record<string, ReplayEntity<any>> | undefined;
export let dataTreeEvaluator: DataTreeEvaluator | undefined;
export const CANVAS = "canvas";
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let canvasWidgetsMeta: Record<string, any>;
export let metaWidgetsCache: MetaWidgetsReduxState;
export let canvasWidgets: CanvasWidgetsReduxState;

export async function evalTree(
  request: EvalWorkerASyncRequest<EvalTreeRequestData>,
) {
  const { data, webworkerTelemetry } = request;

  webworkerTelemetry["transferDataToWorkerThread"].endTime = Date.now();

  let evalOrder: string[] = [];
  let jsUpdates: Record<string, JSUpdate> = {};
  let unEvalUpdates: DataTreeDiff[] = [];
  let isCreateFirstTree = false;
  let dataTree: DataTree = {};
  let errors: EvalError[] = [];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logs: any[] = [];
  let dependencies: DependencyMap = {};
  let evalMetaUpdates: EvalMetaUpdates = [];
  let configTree: ConfigTree = {};
  let staleMetaIds: string[] = [];
  let removedPaths: Array<{ entityId: string; fullpath: string }> = [];
  let isNewWidgetAdded = false;

  const {
    affectedJSObjects,
    allActionValidationConfig,
    appMode,
    cacheProps,
    forceEvaluation,
    metaWidgets,
    shouldReplay,
    shouldRespondWithLogs,
    theme,
    unevalTree: __unevalTree__,
    widgets,
    widgetsMeta,
    widgetTypeConfigMap,
  } = data;

  const unevalTree = __unevalTree__.unEvalTree;

  configTree = __unevalTree__.configTree as ConfigTree;
  canvasWidgets = widgets;
  canvasWidgetsMeta = widgetsMeta;
  metaWidgetsCache = metaWidgets;
  let isNewTree = false;

  try {
    (webworkerTelemetry.__spanAttributes as SpanAttributes)["firstEvaluation"] =
      !dataTreeEvaluator;

    if (!dataTreeEvaluator) {
      isCreateFirstTree = true;
      replayMap = replayMap || {};
      replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
      errorModifier.init(appMode);
      dataTreeEvaluator = new DataTreeEvaluator(
        widgetTypeConfigMap,
        allActionValidationConfig,
      );

      const setupFirstTreeResponse = await profileAsyncFn(
        "setupFirstTree",
        (dataTreeEvaluator as DataTreeEvaluator).setupFirstTree.bind(
          dataTreeEvaluator,
          unevalTree,
          configTree,
          webworkerTelemetry,
          cacheProps,
        ),
        webworkerTelemetry,
        { description: "during initialisation" },
      );

      evalOrder = setupFirstTreeResponse.evalOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      const dataTreeResponse = profileFn(
        "evalAndValidateFirstTree",
        { description: "during initialisation" },
        webworkerTelemetry,
        (dataTreeEvaluator as DataTreeEvaluator).evalAndValidateFirstTree.bind(
          dataTreeEvaluator,
        ),
      );

      dataTree = makeEntityConfigsAsObjProperties(dataTreeResponse.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });
      staleMetaIds = dataTreeResponse.staleMetaIds;
      isNewTree = true;
    } else if (dataTreeEvaluator.hasCyclicalDependency || forceEvaluation) {
      if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
        //allActionValidationConfigs may not be set in dataTreeEvaluator. Therefore, set it explicitly via setter method
        dataTreeEvaluator.setAllActionValidationConfig(
          allActionValidationConfig,
        );
      }

      if (shouldReplay && replayMap) {
        replayMap[CANVAS]?.update({ widgets, theme });
      }

      dataTreeEvaluator = new DataTreeEvaluator(
        widgetTypeConfigMap,
        allActionValidationConfig,
      );

      if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
        dataTreeEvaluator.setAllActionValidationConfig(
          allActionValidationConfig,
        );
      }

      const setupFirstTreeResponse = await profileAsyncFn(
        "setupFirstTree",
        (dataTreeEvaluator as DataTreeEvaluator).setupFirstTree.bind(
          dataTreeEvaluator,
          unevalTree,
          configTree,
          webworkerTelemetry,
          cacheProps,
        ),
        webworkerTelemetry,
        { description: "non-initialisation" },
      );

      isCreateFirstTree = true;
      evalOrder = setupFirstTreeResponse.evalOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      const dataTreeResponse = profileFn(
        "evalAndValidateFirstTree",
        { description: "non-initialisation" },
        webworkerTelemetry,
        () =>
          (dataTreeEvaluator as DataTreeEvaluator).evalAndValidateFirstTree(),
      );

      dataTree = makeEntityConfigsAsObjProperties(dataTreeResponse.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });
      staleMetaIds = dataTreeResponse.staleMetaIds;
    } else {
      if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
        dataTreeEvaluator.setAllActionValidationConfig(
          allActionValidationConfig,
        );
      }

      isCreateFirstTree = false;

      if (shouldReplay && replayMap) {
        replayMap[CANVAS]?.update({ widgets, theme });
      }

      const setupUpdateTreeResponse = profileFn(
        "setupUpdateTree",
        undefined,
        webworkerTelemetry,
        () =>
          (dataTreeEvaluator as DataTreeEvaluator).setupUpdateTree(
            unevalTree,
            configTree,
            webworkerTelemetry,
            affectedJSObjects,
          ),
      );

      evalOrder = setupUpdateTreeResponse.evalOrder;
      jsUpdates = setupUpdateTreeResponse.jsUpdates;
      unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;
      removedPaths = setupUpdateTreeResponse.removedPaths;
      isNewWidgetAdded = setupUpdateTreeResponse.isNewWidgetAdded;

      const updateResponse = profileFn(
        "evalAndValidateSubTree",
        undefined,
        webworkerTelemetry,
        () =>
          (dataTreeEvaluator as DataTreeEvaluator).evalAndValidateSubTree(
            evalOrder,
            configTree,
            unEvalUpdates,
            Object.keys(metaWidgets),
          ),
      );

      dataTree = makeEntityConfigsAsObjProperties(dataTreeEvaluator.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });

      evalMetaUpdates = JSON.parse(
        JSON.stringify(updateResponse.evalMetaUpdates),
      );
      staleMetaIds = updateResponse.staleMetaIds;
    }

    dependencies = dataTreeEvaluator.inverseDependencies;
    errors = dataTreeEvaluator.errors;
    dataTreeEvaluator.clearErrors();
    logs = dataTreeEvaluator.logs;

    if (shouldReplay && replayMap) {
      if (replayMap[CANVAS]?.logs) logs = logs.concat(replayMap[CANVAS]?.logs);

      replayMap[CANVAS]?.clearLogs();
    }

    dataTreeEvaluator.clearLogs();
  } catch (error) {
    if (dataTreeEvaluator !== undefined) {
      errors = dataTreeEvaluator.errors;
      logs = dataTreeEvaluator.logs;
    }

    if (!(error instanceof CrashingError)) {
      errors.push({
        type: EvalErrorTypes.UNKNOWN_ERROR,
        message: (error as Error).message,
      });
      // eslint-disable-next-line
      console.error(error);
    }

    dataTree = getSafeToRenderDataTree(
      makeEntityConfigsAsObjProperties(unevalTree, {
        sanitizeDataTree: false,
        evalProps: dataTreeEvaluator?.evalProps,
      }),
      widgetTypeConfigMap,
      configTree,
    );
    unEvalUpdates = [];
    isNewTree = true;
  }

  const jsVarsCreatedEvent = getJSVariableCreatedEvents(jsUpdates);

  const updates = profileFn(
    "diffAndGenerateSerializeUpdates",
    undefined,
    webworkerTelemetry,
    () => {
      let updates;

      if (isNewTree) {
        try {
          //for new tree send the whole thing, don't diff at all
          updates = serialiseToBigInt([{ kind: "newTree", rhs: dataTree }]);
          dataTreeEvaluator?.setPrevState(dataTree);
        } catch (e) {
          updates = "[]";
        }
        isNewTree = false;
      } else {
        const allUnevalUpdates = unEvalUpdates.map(
          (update) => update.payload.propertyPath,
        );

        const completeEvalOrder = uniqueOrderUpdatePaths([
          ...allUnevalUpdates,
          ...evalOrder,
        ]);

        updates = generateOptimisedUpdatesAndSetPrevState(
          dataTree,
          dataTreeEvaluator,
          completeEvalOrder,
        );
      }

      return updates;
    },
  );

  const evalTreeResponse = {
    updates,
    dependencies,
    errors,
    evalMetaUpdates,
    evaluationOrder: evalOrder,
    jsUpdates,
    webworkerTelemetry,
    // be weary of the payload size of logs it can be huge and contribute to transmission overhead
    // we are only sending logs in local debug mode
    logs: shouldRespondWithLogs ? logs : [],
    unEvalUpdates,
    isCreateFirstTree,
    staleMetaIds,
    removedPaths,
    isNewWidgetAdded,
    undefinedEvalValuesMap: dataTreeEvaluator?.undefinedEvalValuesMap || {},
    jsVarsCreatedEvent,
  };

  webworkerTelemetry["transferDataToMainThread"] = newWebWorkerSpanData(
    "transferDataToMainThread",
    {},
  );

  return evalTreeResponse;
}

export const evalTreeTransmissionErrorHandler: TransmissionErrorHandler = (
  messageId: string,
  startTime: number,
  endTime: number,
  responseData: unknown,
) => {
  const sanitizedData = JSON.parse(JSON.stringify(responseData));

  sendMessage.call(self, {
    messageId,
    messageType: MessageType.RESPONSE,
    body: { data: sanitizedData, startTime, endTime },
  });
};

export function clearCache() {
  dataTreeEvaluator = undefined;
  clearAllIntervals();
  JSObjectCollection.clear();
  DataStore.clear();

  return true;
}
