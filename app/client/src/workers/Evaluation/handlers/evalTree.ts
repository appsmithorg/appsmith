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
import { EvalMetaUpdates } from "workers/common/DataTreeEvaluator/types";
import { initiateLinting } from "workers/Linting/utils";
import {
  CrashingError,
  DataTreeDiff,
  getSafeToRenderDataTree,
} from "../evaluationUtils";
import {
  EvalTreeRequestData,
  EvalTreeResponseData,
  EvalWorkerRequest,
} from "../types";
export let replayMap: Record<string, ReplayEntity<any>>;
export let dataTreeEvaluator: DataTreeEvaluator | undefined;
export const CANVAS = "canvas";

export default function(request: EvalWorkerRequest) {
  const { requestData } = request;
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
    requiresLinting,
    shouldReplay,
    theme,
    unevalTree,
    widgets,
    widgetTypeConfigMap,
  } = requestData as EvalTreeRequestData;
  try {
    if (!dataTreeEvaluator) {
      isCreateFirstTree = true;
      replayMap = replayMap || {};
      replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
      dataTreeEvaluator = new DataTreeEvaluator(
        widgetTypeConfigMap,
        allActionValidationConfig,
      );
      const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
        unevalTree,
      );
      evalOrder = setupFirstTreeResponse.evalOrder;
      lintOrder = setupFirstTreeResponse.lintOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      initiateLinting(
        lintOrder,
        jsUpdates,
        dataTreeEvaluator.oldUnEvalTree,
        requiresLinting,
      );

      const dataTreeResponse = dataTreeEvaluator.evalAndValidateFirstTree();
      dataTree = dataTreeResponse.evalTree;
      dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
    } else if (dataTreeEvaluator.hasCyclicalDependency) {
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
      const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
        unevalTree,
      );
      isCreateFirstTree = true;
      evalOrder = setupFirstTreeResponse.evalOrder;
      lintOrder = setupFirstTreeResponse.lintOrder;
      jsUpdates = setupFirstTreeResponse.jsUpdates;

      initiateLinting(
        lintOrder,
        jsUpdates,
        dataTreeEvaluator.oldUnEvalTree,
        requiresLinting,
      );

      const dataTreeResponse = dataTreeEvaluator.evalAndValidateFirstTree();
      dataTree = dataTreeResponse.evalTree;
      dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
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
      );
      evalOrder = setupUpdateTreeResponse.evalOrder;
      lintOrder = setupUpdateTreeResponse.lintOrder;
      jsUpdates = setupUpdateTreeResponse.jsUpdates;
      unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;

      initiateLinting(
        lintOrder,
        jsUpdates,
        dataTreeEvaluator.oldUnEvalTree,
        requiresLinting,
      );
      nonDynamicFieldValidationOrder =
        setupUpdateTreeResponse.nonDynamicFieldValidationOrder;
      const updateResponse = dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder,
      );
      dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
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
      console.error(error);
    }
    dataTree = getSafeToRenderDataTree(unevalTree, widgetTypeConfigMap);
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
