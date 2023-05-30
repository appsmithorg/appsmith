import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import type ReplayEntity from "entities/Replay";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import { isEmpty, union } from "lodash";
import type { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import type { JSUpdate } from "utils/JSPaneUtils";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { makeEntityConfigsAsObjProperties } from "@appsmith/workers/Evaluation/dataTreeUtils";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
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
import { setEvalContext } from "../evaluate";
import type { TJSPropertiesState } from "../JSObject/jsPropertiesState";
import { jsPropertiesState } from "../JSObject/jsPropertiesState";
import { asyncJsFunctionInDataFields } from "../JSObject/asyncJSFunctionBoundToDataField";
import type { LintTreeSagaRequestData } from "Linting/types";
import { WorkerMessenger } from "../fns/utils/Messenger";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
export let replayMap: Record<string, ReplayEntity<any>> | undefined;
export let dataTreeEvaluator: DataTreeEvaluator | undefined;
export const CANVAS = "canvas";

export default function (request: EvalWorkerSyncRequest) {
  const { data } = request;
  let evalOrder: string[] = [];
  let lintOrder: string[] = [];
  let jsUpdates: Record<string, JSUpdate> = {};
  let unEvalUpdates: DataTreeDiff[] = [];
  let nonDynamicFieldValidationOrder: string[] = [];
  let isCreateFirstTree = false;
  let dataTree: DataTree = {};
  let errors: EvalError[] = [];
  let logs: any[] = [];
  let dependencies: DependencyMap = {};
  let evalMetaUpdates: EvalMetaUpdates = [];
  let configTree: ConfigTree = {};
  let staleMetaIds: string[] = [];
  let pathsToClearErrorsFor: any[] = [];
  let isNewWidgetAdded = false;

  const {
    allActionValidationConfig,
    appMode,
    forceEvaluation,
    metaWidgets,
    requiresLinting,
    shouldReplay,
    theme,
    unevalTree: __unevalTree__,
    widgets,
    widgetTypeConfigMap,
  } = data as EvalTreeRequestData;

  const unevalTree = __unevalTree__.unEvalTree;
  configTree = __unevalTree__.configTree as ConfigTree;
  try {
    if (!dataTreeEvaluator) {
      isCreateFirstTree = true;
      asyncJsFunctionInDataFields.initialize(appMode);
      replayMap = replayMap || {};
      replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
      dataTreeEvaluator = new DataTreeEvaluator(
        widgetTypeConfigMap,
        allActionValidationConfig,
      );

      const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
        unevalTree,
        configTree,
      );
      evalOrder = setupFirstTreeResponse.evalOrder;
      lintOrder = union(
        setupFirstTreeResponse.lintOrder,
        jsPropertiesState.getUpdatedJSProperties(),
      );
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      initiateLinting({
        lintOrder,
        unevalTree: makeEntityConfigsAsObjProperties(
          dataTreeEvaluator.oldUnEvalTree,
          {
            sanitizeDataTree: false,
          },
        ),
        requiresLinting,
        jsPropertiesState: jsPropertiesState.getMap(),
        asyncJSFunctionsInDataFields: asyncJsFunctionInDataFields.getMap(),
        configTree: dataTreeEvaluator.oldConfigTree,
      });

      const dataTreeResponse = dataTreeEvaluator.evalAndValidateFirstTree();
      dataTree = makeEntityConfigsAsObjProperties(dataTreeResponse.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });
      staleMetaIds = dataTreeResponse.staleMetaIds;
    } else if (dataTreeEvaluator.hasCyclicalDependency || forceEvaluation) {
      if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
        //allActionValidationConfigs may not be set in dataTreeEvaluatior. Therefore, set it explicitly via setter method
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
      const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
        unevalTree,
        configTree,
      );
      isCreateFirstTree = true;
      evalOrder = setupFirstTreeResponse.evalOrder;
      lintOrder = union(
        setupFirstTreeResponse.lintOrder,
        jsPropertiesState.getUpdatedJSProperties(),
      );
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      initiateLinting({
        lintOrder,
        unevalTree: makeEntityConfigsAsObjProperties(
          dataTreeEvaluator.oldUnEvalTree,
          {
            sanitizeDataTree: false,
          },
        ),
        requiresLinting,
        jsPropertiesState: jsPropertiesState.getMap(),
        asyncJSFunctionsInDataFields: asyncJsFunctionInDataFields.getMap(),
        configTree: dataTreeEvaluator.oldConfigTree,
      });

      const dataTreeResponse = dataTreeEvaluator.evalAndValidateFirstTree();

      setEvalContext({
        dataTree: dataTreeEvaluator.evalTree,
        isDataField: false,
        isTriggerBased: true,
      });

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
      const setupUpdateTreeResponse = dataTreeEvaluator.setupUpdateTree(
        unevalTree,
        configTree,
      );

      evalOrder = setupUpdateTreeResponse.evalOrder;
      lintOrder = union(
        setupUpdateTreeResponse.lintOrder,
        jsPropertiesState.getUpdatedJSProperties(),
      );
      jsUpdates = setupUpdateTreeResponse.jsUpdates;
      unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;
      pathsToClearErrorsFor = setupUpdateTreeResponse.pathsToClearErrorsFor;
      isNewWidgetAdded = setupUpdateTreeResponse.isNewWidgetAdded;

      initiateLinting({
        lintOrder,
        unevalTree: makeEntityConfigsAsObjProperties(
          dataTreeEvaluator.oldUnEvalTree,
          {
            sanitizeDataTree: false,
          },
        ),
        requiresLinting,
        jsPropertiesState: jsPropertiesState.getMap(),
        asyncJSFunctionsInDataFields: asyncJsFunctionInDataFields.getMap(),
        configTree: dataTreeEvaluator.oldConfigTree,
      });
      nonDynamicFieldValidationOrder =
        setupUpdateTreeResponse.nonDynamicFieldValidationOrder;

      const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder,
        configTree,
        unEvalUpdates,
        Object.keys(metaWidgets),
      );

      setEvalContext({
        dataTree: dataTreeEvaluator.evalTree,
        isDataField: false,
        isTriggerBased: true,
      });

      dataTree = makeEntityConfigsAsObjProperties(dataTreeEvaluator.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });

      evalMetaUpdates = JSON.parse(
        JSON.stringify(updateResponse.evalMetaUpdates),
      );
      staleMetaIds = updateResponse.staleMetaIds;
    }
    dataTreeEvaluator = dataTreeEvaluator as DataTreeEvaluator;
    dependencies = dataTreeEvaluator.inverseDependencyMap;
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
    configTree,
    staleMetaIds,
    pathsToClearErrorsFor,
    isNewWidgetAdded,
    undefinedEvalValuesMap: dataTreeEvaluator?.undefinedEvalValuesMap || {},
  };

  return evalTreeResponse;
}

export function clearCache() {
  dataTreeEvaluator = undefined;
  clearAllIntervals();
  JSObjectCollection.clear();
  return true;
}

interface initiateLintingProps {
  asyncJSFunctionsInDataFields: DependencyMap;
  lintOrder: string[];
  unevalTree: DataTree;
  requiresLinting: boolean;
  jsPropertiesState: TJSPropertiesState;
  configTree: ConfigTree;
}

export function initiateLinting({
  asyncJSFunctionsInDataFields,
  configTree,
  jsPropertiesState,
  lintOrder,
  requiresLinting,
  unevalTree,
}: initiateLintingProps) {
  const data = {
    pathsToLint: lintOrder,
    unevalTree,
    jsPropertiesState,
    asyncJSFunctionsInDataFields,
    configTree,
  } as LintTreeSagaRequestData;
  if (!requiresLinting) return;
  WorkerMessenger.ping({
    data,
    method: MAIN_THREAD_ACTION.LINT_TREE,
  });
}
