---
title: How to evaluate the JS code written by the user
---
# Introduction

This document will walk you through the implementation of the feature that evaluates the JavaScript code written by the user.

The feature is designed to evaluate the user's JavaScript code in a safe and efficient manner, taking into account various factors such as dependencies, errors, and updates.

We will cover:

1. How the evaluation process is initiated and how the initial state is set up.


2. How the evaluation process handles updates and changes.


3. How the evaluation process handles errors and crashes.


4. How the evaluation process cleans up and clears the cache.

# Setting up the evaluation process

<SwmSnippet path="/app/client/src/workers/Evaluation/handlers/evalTree.ts" line="1">

---

The evaluation process is initiated in the evalTree function in the app/client/src/workers/Evaluation/handlers/evalTree.ts file. This function takes a EvalWorkerSyncRequest as an argument, which contains the data to be evaluated and telemetry information.

```typescript
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import type ReplayEntity from "entities/Replay";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import { isEmpty } from "lodash";
import type { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import type { JSUpdate } from "utils/JSPaneUtils";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { makeEntityConfigsAsObjProperties } from "@appsmith/workers/Evaluation/dataTreeUtils";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import { serialiseToBigInt } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  CrashingError,
  getSafeToRenderDataTree,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  EvalTreeRequestData,
  EvalTreeResponseData,
  EvalWorkerSyncRequest,
} from "../types";
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
} from "UITelemetry/generateWebWorkerTraces";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

export let replayMap: Record<string, ReplayEntity<any>> | undefined;
export let dataTreeEvaluator: DataTreeEvaluator | undefined;
export const CANVAS = "canvas";
export let canvasWidgetsMeta: Record<string, any>;
export let metaWidgetsCache: MetaWidgetsReduxState;
export let canvasWidgets: CanvasWidgetsReduxState;

export function evalTree(request: EvalWorkerSyncRequest) {
  const { data, webworkerTelemetry } = request;
  webworkerTelemetry["transferDataToWorkerThread"].endTime = Date.now();

  let evalOrder: string[] = [];
  let jsUpdates: Record<string, JSUpdate> = {};
  let unEvalUpdates: DataTreeDiff[] = [];
  let isCreateFirstTree = false;
  let dataTree: DataTree = {};
  let errors: EvalError[] = [];
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
    forceEvaluation,
    metaWidgets,
    shouldReplay,
    shouldRespondWithLogs,
    theme,
    unevalTree: __unevalTree__,
    widgets,
    widgetsMeta,
    widgetTypeConfigMap,
  } = data as EvalTreeRequestData;

  const unevalTree = __unevalTree__.unEvalTree;
  configTree = __unevalTree__.configTree as ConfigTree;
  canvasWidgets = widgets;
  canvasWidgetsMeta = widgetsMeta;
  metaWidgetsCache = metaWidgets;
  let isNewTree = false;

  try {
    if (!dataTreeEvaluator) {
      isCreateFirstTree = true;
      replayMap = replayMap || {};
      replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
      errorModifier.init(appMode);
      dataTreeEvaluator = new DataTreeEvaluator(
        widgetTypeConfigMap,
        allActionValidationConfig,
      );

      const setupFirstTreeResponse = profileFn(
        "setupFirstTree",
        { description: "during initialisation" },
        webworkerTelemetry,
        () =>
          dataTreeEvaluator?.setupFirstTree(
            unevalTree,
            configTree,
            webworkerTelemetry,
          ),
      );

      evalOrder = setupFirstTreeResponse.evalOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      const dataTreeResponse = profileFn(
        "evalAndValidateFirstTree",
        { description: "during initialisation" },
        webworkerTelemetry,
        () => dataTreeEvaluator?.evalAndValidateFirstTree(),
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

      const setupFirstTreeResponse = profileFn(
        "setupFirstTree",
        { description: "non-initialisation" },
        webworkerTelemetry,
        () => dataTreeEvaluator?.setupFirstTree(unevalTree, configTree),
      );
      isCreateFirstTree = true;
      evalOrder = setupFirstTreeResponse.evalOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      const dataTreeResponse = profileFn(
        "evalAndValidateFirstTree",
        { description: "non-initialisation" },
        webworkerTelemetry,
        () => dataTreeEvaluator?.evalAndValidateFirstTree(),
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
          dataTreeEvaluator?.setupUpdateTree(
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
          dataTreeEvaluator?.evalAndValidateSubTree(
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

  const evalTreeResponse: EvalTreeResponseData = {
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
```

---

</SwmSnippet>

The function starts by initializing several variables that will be used throughout the evaluation process. These include the evaluation order, updates to JavaScript objects, updates to the data tree, errors, logs, dependencies, and more.

If the `DataTreeEvaluator` is not yet initialized, the function creates a new instance and sets up the first tree. This involves setting up the evaluation order and updates, and then evaluating and validating the first tree. The resulting data tree is then converted into an object with entity configurations as properties.

If the `DataTreeEvaluator` is already initialized, the function checks if there are any cyclical dependencies or if a forced evaluation is required. If so, it creates a new `DataTreeEvaluator` and sets up the first tree as described above. If not, it sets up an update tree, which involves setting up the evaluation order and updates, and then evaluating and validating the sub-tree.

# Handling updates and changes

The evaluation process is designed to handle updates and changes efficiently. If a new tree is created, the function serializes the entire tree and sets it as the previous state. If not, it generates optimized updates and sets the previous state accordingly.

The function then creates a response object that contains the updates, dependencies, errors, evaluation order, JavaScript updates, telemetry information, logs, unevaluated updates, and more. This response object is then returned by the function.

# Handling errors and crashes

The evaluation process is designed to handle errors and crashes gracefully. If an error occurs during the evaluation process, the function catches the error and adds it to the list of errors. If the error is not a `CrashingError`, it also logs the error message.

In case of an error, the function creates a safe-to-render data tree and sets the unevaluated updates to an empty array. It also sets the `isNewTree` flag to `true`, indicating that a new tree has been created.

# Clearing the cache

Finally, the `clearCache` function is used to clear the cache after the evaluation process is completed. This involves setting the `DataTreeEvaluator` to `undefined`, clearing all intervals, clearing the `JSObjectCollection`, and clearing the `DataStore`. This function returns `true` to indicate that the cache has been successfully cleared.

<SwmMeta version="3.0.0" repo-id="Z2l0aHViJTNBJTNBYXBwc21pdGglM0ElM0FhcHBzbWl0aG9yZw==" repo-name="appsmith"><sup>Powered by [Swimm](https://app.swimm.io/)</sup></SwmMeta>
