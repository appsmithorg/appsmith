import { UserLogObject } from "entities/AppsmithConsole";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import ReplayEntity from "entities/Replay";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import { isEmpty } from "lodash";
import {
  DependencyMap,
  EvalError,
  EvalErrorTypes,
} from "utils/DynamicBindingUtils";
import { JSUpdate } from "utils/JSPaneUtils";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { initiateLinting } from "workers/Linting/utils";
import {
  createUnEvalTreeForEval,
  makeEntityConfigsAsObjProperties,
} from "@appsmith/workers/Evaluation/dataTreeUtils";
import {
  CrashingError,
  DataTreeDiff,
  getSafeToRenderDataTree,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  EvalTreeRequestData,
  EvalTreeResponseData,
  EvalWorkerSyncRequest,
} from "../types";
export let replayMap: Record<string, ReplayEntity<any>>;
export let dataTreeEvaluator: DataTreeEvaluator | undefined;
export const CANVAS = "canvas";

export default function(request: EvalWorkerSyncRequest) {
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
  let userLogs: UserLogObject[] = [];
  let dependencies: DependencyMap = {};
  let evalMetaUpdates: EvalMetaUpdates = [];

  const {
    allActionValidationConfig,
    forceEvaluation,
    requiresLinting,
    shouldReplay,
    theme,
    unevalTree: __unevalTree__,
    widgets,
    widgetTypeConfigMap,
  } = data as EvalTreeRequestData;

  // const unevalAndConfigTreeObject = createUnEvalTreeForEval(__unevalTree__);
  const unevalAndConfigTreeObject = __unevalTree__;
  const unevalTree = unevalAndConfigTreeObject.dataTree;
  const configTree = unevalAndConfigTreeObject.configTree;
  console.log("**** evaltree + configTree", unevalTree, configTree);
  try {
    if (!dataTreeEvaluator) {
      isCreateFirstTree = true;
      replayMap = replayMap || {};
      replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
      dataTreeEvaluator = new DataTreeEvaluator(
        widgetTypeConfigMap,
        allActionValidationConfig,
      );
      console.log(" **# 1", unevalTree);

      const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
        unevalTree,
        configTree,
      );
      evalOrder = setupFirstTreeResponse.evalOrder;
      lintOrder = setupFirstTreeResponse.lintOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      initiateLinting(
        lintOrder,
        makeEntityConfigsAsObjProperties(dataTreeEvaluator.oldUnEvalTree, {
          sanitizeDataTree: false,
        }),
        requiresLinting,
      );

      const dataTreeResponse = dataTreeEvaluator.evalAndValidateFirstTree();
      dataTree = makeEntityConfigsAsObjProperties(dataTreeResponse.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });
    } else if (dataTreeEvaluator.hasCyclicalDependency || forceEvaluation) {
      if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
        //allActionValidationConfigs may not be set in dataTreeEvaluatior. Therefore, set it explicitly via setter method
        dataTreeEvaluator.setAllActionValidationConfig(
          allActionValidationConfig,
        );
      }
      if (shouldReplay) {
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
      console.log(" **# 2");
      const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
        unevalTree,
        configTree,
      );
      isCreateFirstTree = true;
      evalOrder = setupFirstTreeResponse.evalOrder;
      lintOrder = setupFirstTreeResponse.lintOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      initiateLinting(
        lintOrder,
        makeEntityConfigsAsObjProperties(dataTreeEvaluator.oldUnEvalTree, {
          sanitizeDataTree: false,
        }),
        requiresLinting,
      );

      const dataTreeResponse = dataTreeEvaluator.evalAndValidateFirstTree();
      dataTree = makeEntityConfigsAsObjProperties(dataTreeResponse.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });
    } else {
      if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
        dataTreeEvaluator.setAllActionValidationConfig(
          allActionValidationConfig,
        );
      }
      isCreateFirstTree = false;
      if (shouldReplay) {
        replayMap[CANVAS]?.update({ widgets, theme });
      }
      const setupUpdateTreeResponse = dataTreeEvaluator.setupUpdateTree(
        unevalTree,
        configTree,
      );
      evalOrder = setupUpdateTreeResponse.evalOrder;
      lintOrder = setupUpdateTreeResponse.lintOrder;
      jsUpdates = setupUpdateTreeResponse.jsUpdates;
      unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;

      initiateLinting(
        lintOrder,
        makeEntityConfigsAsObjProperties(dataTreeEvaluator.oldUnEvalTree, {
          sanitizeDataTree: false,
        }),
        requiresLinting,
      );

      nonDynamicFieldValidationOrder =
        setupUpdateTreeResponse.nonDynamicFieldValidationOrder;
      const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder,
      );
      dataTree = makeEntityConfigsAsObjProperties(dataTreeEvaluator.evalTree, {
        evalProps: dataTreeEvaluator.evalProps,
      });
      evalMetaUpdates = JSON.parse(
        JSON.stringify(updateResponse.evalMetaUpdates),
      );
    }
    dataTreeEvaluator = dataTreeEvaluator as DataTreeEvaluator;
    dependencies = dataTreeEvaluator.inverseDependencyMap;
    errors = dataTreeEvaluator.errors;
    dataTreeEvaluator.clearErrors();
    logs = dataTreeEvaluator.logs;
    userLogs = dataTreeEvaluator.userLogs;
    if (shouldReplay) {
      if (replayMap[CANVAS]?.logs) logs = logs.concat(replayMap[CANVAS]?.logs);
      replayMap[CANVAS]?.clearLogs();
    }

    dataTreeEvaluator.clearLogs();
  } catch (error) {
    if (dataTreeEvaluator !== undefined) {
      errors = dataTreeEvaluator.errors;
      logs = dataTreeEvaluator.logs;
      userLogs = dataTreeEvaluator.userLogs;
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

  return {
    dataTree,
    dependencies,
    errors,
    evalMetaUpdates,
    evaluationOrder: evalOrder,
    jsUpdates,
    logs,
    userLogs,
    unEvalUpdates,
    isCreateFirstTree,
  } as EvalTreeResponseData;
}

export function clearCache() {
  dataTreeEvaluator = undefined;
  return true;
}
