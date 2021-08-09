import { ENTITY_TYPE, Message } from "entities/AppsmithConsole";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
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
import _ from "lodash";
import LOG_TYPE from "../entities/AppsmithConsole/logtype";
import moment from "moment/moment";
import { put, select } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
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
  VALUE_IS_INVALID,
} from "constants/messages";
import log from "loglevel";
import { AppState } from "reducers";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import TernServer from "utils/autocomplete/TernServer";
import { logDebuggerErrorAnalytics } from "actions/debuggerActions";
import store from "../store";
import { Diff } from "deep-diff";

const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;

function getLatestEvalPropertyErrors(
  currentDebuggerErrors: Record<string, Message>,
  dataTree: DataTree,
  evaluationOrder: Array<string>,
) {
  const updatedDebuggerErrors: Record<string, Message> = {
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
      const allEvalErrors: EvaluationError[] = _.get(
        entity,
        getEvalErrorPath(evaluatedPath, false),
        [],
      );
      const evaluatedValue = _.get(
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
        const error = evalErrors[0];
        const errorMessages = evalErrors.map((e) => ({
          message: e.errorMessage,
        }));

        if (!(debuggerKey in updatedDebuggerErrors)) {
          store.dispatch(
            logDebuggerErrorAnalytics({
              eventName: "DEBUGGER_NEW_ERROR",
              entityId: idField,
              entityName: nameField,
              entityType,
              propertyPath,
              errorMessages,
            }),
          );
        }

        const analyticsData = isWidget(entity)
          ? {
              widgetType: entity.type,
            }
          : {};

        // Add or update
        updatedDebuggerErrors[debuggerKey] = {
          logType: LOG_TYPE.EVAL_ERROR,
          // Unless the intention is to change the message shown in the debugger please do not
          // change the text shown here
          text: createMessage(VALUE_IS_INVALID, propertyPath),
          messages: errorMessages,
          severity: error.severity,
          timestamp: moment().format("hh:mm:ss"),
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
        };
      } else if (debuggerKey in updatedDebuggerErrors) {
        store.dispatch(
          logDebuggerErrorAnalytics({
            eventName: "DEBUGGER_RESOLVED_ERROR",
            entityId: idField,
            entityName: nameField,
            entityType,
            propertyPath:
              updatedDebuggerErrors[debuggerKey].source?.propertyPath ?? "",
            errorMessages: updatedDebuggerErrors[debuggerKey].messages ?? [],
          }),
        );
        // Remove
        delete updatedDebuggerErrors[debuggerKey];
      }
    }
  }
  return updatedDebuggerErrors;
}

export function* evalErrorHandler(
  errors: EvalError[],
  dataTree?: DataTree,
  evaluationOrder?: Array<string>,
): any {
  if (dataTree && evaluationOrder) {
    const currentDebuggerErrors: Record<string, Message> = yield select(
      getDebuggerErrors,
    );
    const evalPropertyErrors = getLatestEvalPropertyErrors(
      currentDebuggerErrors,
      dataTree,
      evaluationOrder,
    );

    yield put({
      type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS,
      payload: evalPropertyErrors,
    });
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
      const unevalValue = _.get(unEvalTree, evaluatedPath);
      const entityType = isAction(entity) ? entity.pluginType : entity.type;
      const isABinding = _.find(entity.dynamicBindingPathList, {
        key: propertyPath,
      });
      const logBlackList = entity.logBlackList;
      const errors: EvaluationError[] = _.get(
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

// Update only the changed entities on tern. We will pick up the updated
// entities from the evaluation order and create a new def from them.
// When there is a top level entity removed in removedPaths,
// we will remove its def
export function* updateTernDefinitions(
  dataTree: DataTree,
  isFirstEvaluation: boolean,
  updates: Diff<DataTree, DataTree>[],
) {
  const updatedEntities: Set<string> = new Set();
  // If it is the first evaluation, we want to add everything in the data tree
  if (isFirstEvaluation) {
    TernServer.resetServer();
    Object.keys(dataTree).forEach((key) => updatedEntities.add(key));
  } else {
    updates.forEach((update) => {
      if (update.kind === "N" && update.path) {
        updatedEntities.add(update?.path[0]);
      }
    });
  }

  updatedEntities.forEach((entityName) => {
    const entity = dataTree[entityName];
    if (entity) {
      const { def, name } = dataTreeTypeDefCreator(entity, entityName);
      TernServer.updateDef(name, def);
    }
  });
  // removedPaths.forEach((path) => {
  //   // No '.' means that the path is an entity name
  //   if (path.split(".").length === 1) {
  //     TernServer.removeDef(path);
  //   }
  // });
}
