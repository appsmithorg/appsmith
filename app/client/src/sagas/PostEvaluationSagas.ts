import { ENTITY_TYPE, Log } from "entities/AppsmithConsole";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "workers/evaluationUtils";
import {
  EvalError,
  EvalErrorTypes,
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { find, get, some } from "lodash";
import LOG_TYPE from "../entities/AppsmithConsole/logtype";
import { put, select } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import AppsmithConsole from "../utils/AppsmithConsole";
import * as Sentry from "@sentry/react";
import AnalyticsUtil from "../utils/AnalyticsUtil";
import {
  createMessage,
  ERROR_EVAL_ERROR_GENERIC,
  ERROR_EVAL_TRIGGER,
  PARSE_JS_FUNCTION_ERROR,
  VALUE_IS_INVALID,
} from "constants/messages";
import log from "loglevel";
import { AppState } from "reducers";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import TernServer from "utils/autocomplete/TernServer";

const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;

function logLatestEvalPropertyErrors(
  currentDebuggerErrors: Record<string, Log>,
  dataTree: DataTree,
  evaluationOrder: Array<string>,
) {
  const updatedDebuggerErrors: Record<string, Log> = {
    ...currentDebuggerErrors,
  };

  for (const evaluatedPath of evaluationOrder) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      evaluatedPath,
    );
    const entity = dataTree[entityName];
    if (isWidget(entity) || isAction(entity)) {
      if (propertyPath in entity.logBlackList) {
        continue;
      }
      const allEvalErrors: EvaluationError[] = get(
        entity,
        getEvalErrorPath(evaluatedPath, false),
        [],
      );
      const evaluatedValue = get(
        entity,
        getEvalValuePath(evaluatedPath, false),
      );
      const evalErrors = allEvalErrors.filter(
        (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
      );
      const idField = isWidget(entity) ? entity.widgetId : entity.actionId;
      const nameField = isWidget(entity) ? entity.widgetName : entity.name;
      const entityType = isWidget(entity)
        ? ENTITY_TYPE.WIDGET
        : ENTITY_TYPE.ACTION;
      const debuggerKey = idField + "-" + propertyPath;
      // if dataTree has error but debugger does not -> add
      // if debugger has error and data tree has error -> update error
      // if debugger has error but data tree does not -> remove
      // if debugger or data tree does not have an error -> no change

      if (evalErrors.length) {
        // TODO Rank and set the most critical error
        // const error = evalErrors[0];
        // Reformatting eval errors here to a format usable by the debugger
        const errorMessages = evalErrors.map((e) => {
          // Error format required for the debugger
          const formattedError = {
            message: e.errorMessage,
            type: e.errorType,
          };

          return formattedError;
        });

        const analyticsData = isWidget(entity)
          ? {
              widgetType: entity.type,
            }
          : {};

        // Add or update
        AppsmithConsole.addError({
          id: debuggerKey,
          logType: LOG_TYPE.EVAL_ERROR,
          // Unless the intention is to change the message shown in the debugger please do not
          // change the text shown here
          text: createMessage(VALUE_IS_INVALID, propertyPath),
          messages: errorMessages,
          source: {
            id: idField,
            name: nameField,
            type: entityType,
            propertyPath: propertyPath,
          },
          state: {
            [propertyPath]: evaluatedValue,
          },
          analytics: analyticsData,
        });
      } else if (debuggerKey in updatedDebuggerErrors) {
        AppsmithConsole.deleteError(debuggerKey);
      }
    }
  }
}

export function* evalErrorHandler(
  errors: EvalError[],
  dataTree?: DataTree,
  evaluationOrder?: Array<string>,
): any {
  if (dataTree && evaluationOrder) {
    const currentDebuggerErrors: Record<string, Log> = yield select(
      getDebuggerErrors,
    );
    // Update latest errors to the debugger
    logLatestEvalPropertyErrors(
      currentDebuggerErrors,
      dataTree,
      evaluationOrder,
    );
  }

  errors.forEach((error) => {
    switch (error.type) {
      case EvalErrorTypes.CYCLICAL_DEPENDENCY_ERROR: {
        if (error.context) {
          // Add more info about node for the toast
          const { dependencyMap, diffs, entityType, node } = error.context;
          Toaster.show({
            text: `${error.message} Node was: ${node}`,
            variant: Variant.danger,
          });
          AppsmithConsole.error({
            text: `${error.message} Node was: ${node}`,
          });
          // Send the generic error message to sentry for better grouping
          Sentry.captureException(new Error(error.message), {
            tags: {
              node,
              entityType,
            },
            extra: {
              dependencyMap,
              diffs,
            },
            // Level is warning because it could be a user error
            level: Sentry.Severity.Warning,
          });
          // Log an analytics event for cyclical dep errors
          AnalyticsUtil.logEvent("CYCLICAL_DEPENDENCY_ERROR", {
            node,
            entityType,
            // Level is warning because it could be a user error
            level: Sentry.Severity.Warning,
          });
        }

        break;
      }
      case EvalErrorTypes.EVAL_TREE_ERROR: {
        Toaster.show({
          text: createMessage(ERROR_EVAL_ERROR_GENERIC),
          variant: Variant.danger,
        });
        break;
      }
      case EvalErrorTypes.BAD_UNEVAL_TREE_ERROR: {
        Sentry.captureException(error);
        break;
      }
      case EvalErrorTypes.EVAL_TRIGGER_ERROR: {
        log.debug(error);
        Toaster.show({
          text: createMessage(ERROR_EVAL_TRIGGER, error.message),
          variant: Variant.danger,
          showDebugButton: true,
        });
        AppsmithConsole.error({
          text: createMessage(ERROR_EVAL_TRIGGER, error.message),
        });
        break;
      }
      case EvalErrorTypes.EVAL_PROPERTY_ERROR: {
        log.debug(error);
        break;
      }
      case EvalErrorTypes.PARSE_JS_ERROR: {
        AppsmithConsole.error({
          logType: LOG_TYPE.JS_PARSE_ERROR,
          text: createMessage(PARSE_JS_FUNCTION_ERROR, error.message),
          source: {
            type: ENTITY_TYPE.JSACTION,
            name: error?.context?.name,
            id: error?.context?.id,
          },
        });
        break;
      }
      default: {
        Sentry.captureException(error);
        log.debug(error);
      }
    }
  });
}

export function* logSuccessfulBindings(
  unEvalTree: DataTree,
  dataTree: DataTree,
  evaluationOrder: string[],
) {
  const appMode = yield select(getAppMode);
  if (appMode === APP_MODE.PUBLISHED) return;
  if (!evaluationOrder) return;
  evaluationOrder.forEach((evaluatedPath) => {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      evaluatedPath,
    );
    const entity = dataTree[entityName];
    if (isAction(entity) || isWidget(entity)) {
      const unevalValue = get(unEvalTree, evaluatedPath);
      const entityType = isAction(entity) ? entity.pluginType : entity.type;
      const isABinding = find(entity.dynamicBindingPathList, {
        key: propertyPath,
      });
      const logBlackList = entity.logBlackList;
      const errors: EvaluationError[] = get(
        dataTree,
        getEvalErrorPath(evaluatedPath),
        [],
      ) as EvaluationError[];
      const criticalErrors = errors.filter(
        (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
      );
      const hasErrors = criticalErrors.length > 0;

      if (isABinding && !hasErrors && !(propertyPath in logBlackList)) {
        AnalyticsUtil.logEvent("BINDING_SUCCESS", {
          unevalValue,
          entityType,
          propertyPath,
        });
      }
    }
  });
}

export function* postEvalActionDispatcher(
  actions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
) {
  for (const action of actions) {
    yield put(action);
  }
}

// We update the data tree definition after every eval so that autocomplete
// is accurate
export function* updateTernDefinitions(
  dataTree: DataTree,
  updates?: DataTreeDiff[],
) {
  let shouldUpdate: boolean;
  // No updates means it was a first Eval
  if (!updates) {
    shouldUpdate = true;
  } else if (updates.length === 0) {
    // update length is 0 means no significant updates
    shouldUpdate = false;
  } else {
    // Only when new field is added or deleted, we want to re create the def
    shouldUpdate = some(updates, (update) => {
      return (
        update.event === DataTreeDiffEvent.NEW ||
        update.event === DataTreeDiffEvent.DELETE
      );
    });
  }
  if (shouldUpdate) {
    const start = performance.now();
    const { def, entityInfo } = dataTreeTypeDefCreator(dataTree);
    TernServer.updateDef("DATA_TREE", def, entityInfo);
    const end = performance.now();
    log.debug("Tern", { updates });
    log.debug("Tern definitions updated took ", (end - start).toFixed(2));
  }
}
