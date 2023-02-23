import {
  ENTITY_TYPE,
  Log,
  PLATFORM_ERROR,
  Severity,
} from "entities/AppsmithConsole";
import { DataTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getDataTreeForAutocomplete,
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  EvalError,
  EvalErrorTypes,
  EvaluationError,
  getEvalErrorPath,
} from "utils/DynamicBindingUtils";
import { find, get, some } from "lodash";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { put, select } from "redux-saga/effects";
import { AnyReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { Toaster, Variant } from "design-system-old";
import AppsmithConsole from "utils/AppsmithConsole";
import * as Sentry from "@sentry/react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  ERROR_EVAL_ERROR_GENERIC,
  JS_OBJECT_BODY_INVALID,
  VALUE_IS_INVALID,
  JS_EXECUTION_FAILURE,
} from "@appsmith/constants/messages";
import log from "loglevel";
import { AppState } from "@appsmith/reducers";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import { selectFeatureFlags } from "selectors/usersSelectors";
import FeatureFlags from "entities/FeatureFlags";
import { JSAction } from "entities/JSCollection";
import { isWidgetPropertyNamePath } from "utils/widgetEvalUtils";

const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;

function logLatestEvalPropertyErrors(
  currentDebuggerErrors: Record<string, Log>,
  dataTree: DataTree,
  evaluationOrder: Array<string>,
  pathsToClearErrorsFor?: any[],
) {
  const errorsToAdd = [];
  const errorsToDelete = [];
  const updatedDebuggerErrors: Record<string, Log> = {
    ...currentDebuggerErrors,
  };

  for (const evaluatedPath of evaluationOrder) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      evaluatedPath,
    );
    const entity = dataTree[entityName];
    if (isWidget(entity) || isAction(entity) || isJSAction(entity)) {
      if (entity.logBlackList && propertyPath in entity.logBlackList) {
        continue;
      }
      const allEvalErrors: EvaluationError[] = get(
        entity,
        getEvalErrorPath(evaluatedPath, {
          fullPath: false,
          isPopulated: false,
        }),
        [],
      );
      const evalErrors: EvaluationError[] = [];
      const evalWarnings: EvaluationError[] = [];

      for (const err of allEvalErrors) {
        if (err.severity === Severity.WARNING) {
          evalWarnings.push(err);
        }
        if (err.severity === Severity.ERROR) {
          evalErrors.push(err);
        }
      }

      const idField = isWidget(entity) ? entity.widgetId : entity.actionId;
      const nameField = isWidget(entity) ? entity.widgetName : entityName;
      const entityType = isWidget(entity)
        ? ENTITY_TYPE.WIDGET
        : isAction(entity)
        ? ENTITY_TYPE.ACTION
        : ENTITY_TYPE.JSACTION;
      const pluginTypeField = isAction(entity)
        ? entity.pluginType
        : entity.type;
      const iconId = isWidget(entity)
        ? entity.widgetId
        : isJSAction(entity)
        ? entity.actionId
        : entity.pluginId;
      const debuggerKeys = [
        {
          key: `${idField}-${propertyPath}`,
          errors: evalErrors,
        },
        {
          key: `${idField}-${propertyPath}-warning`,
          errors: evalWarnings,
          isWarning: true,
        },
      ];

      const httpMethod = get(entity.config, "httpMethod") || undefined;

      for (const { errors, isWarning, key: debuggerKey } of debuggerKeys) {
        // if dataTree has error but debugger does not -> add
        // if debugger has error and data tree has error -> update error
        // if debugger has error but data tree does not -> remove
        // if debugger or data tree does not have an error -> no change
        if (errors.length) {
          // TODO Rank and set the most critical error
          // const error = evalErrors[0];
          // Reformatting eval errors here to a format usable by the debugger
          const errorMessages = errors.map((e) => {
            // Error format required for the debugger
            return { message: e.errorMessage, type: e.errorType };
          });

          const analyticsData = isWidget(entity)
            ? {
                widgetType: entity.type,
              }
            : {};
          const logPropertyPath = !isJSAction(entity)
            ? propertyPath
            : entityName;
          // Add or update
          if (
            !isJSAction(entity) ||
            (isJSAction(entity) && propertyPath === "body")
          ) {
            errorsToAdd.push({
              payload: {
                id: debuggerKey,
                iconId: iconId,
                logType: isWarning
                  ? LOG_TYPE.EVAL_WARNING
                  : LOG_TYPE.EVAL_ERROR,
                // Unless the intention is to change the message shown in the debugger please do not
                // change the text shown here
                text: isJSAction(entity)
                  ? createMessage(JS_OBJECT_BODY_INVALID)
                  : createMessage(VALUE_IS_INVALID, propertyPath),
                messages: errorMessages,
                source: {
                  id: idField,
                  name: nameField,
                  type: entityType,
                  propertyPath: logPropertyPath,
                  pluginType: pluginTypeField,
                  httpMethod,
                },
                analytics: analyticsData,
              },
              severity: isWarning ? Severity.WARNING : Severity.ERROR,
            });
          }
        } else if (debuggerKey in updatedDebuggerErrors) {
          errorsToDelete.push({ id: debuggerKey });
        }
      }
    }
  }

  /* Clear errors for paths that are no longer in the data tree. Since the evaluation order is updated
  without the paths that are no longer in the data tree, we need to keep track of the paths that
   were removed during evaluations and use them to clear any errors that were previously added
  for those paths.
  */

  if (pathsToClearErrorsFor) {
    for (const error of pathsToClearErrorsFor) {
      const widgetId = error.widgetId;

      error.paths.forEach((path: string) => {
        const { propertyPath } = getEntityNameAndPropertyPath(path);

        errorsToDelete.push({ id: `${widgetId}-${propertyPath}` });
      });
    }
  }

  // Add and delete errors from debugger
  AppsmithConsole.addErrors(errorsToAdd);
  AppsmithConsole.deleteErrors(errorsToDelete);
}

export function* evalErrorHandler(
  errors: EvalError[],
  dataTree?: DataTree,
  evaluationOrder?: Array<string>,
  pathsToClearErrorsFor?: any[],
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
      pathsToClearErrorsFor,
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
      case EvalErrorTypes.EVAL_PROPERTY_ERROR: {
        log.debug(error);
        break;
      }
      case EvalErrorTypes.CLONE_ERROR: {
        Sentry.captureException(new Error(error.message), {
          extra: {
            request: error.context,
          },
        });
        break;
      }
      case EvalErrorTypes.PARSE_JS_ERROR: {
        Toaster.show({
          text: `${error.message} at: ${error.context?.entity.name}`,
          variant: Variant.danger,
        });
        AppsmithConsole.error({
          text: `${error.message} at: ${error.context?.propertyPath}`,
        });
        break;
      }
      case EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR: {
        Sentry.captureException(new Error(error.message), {
          extra: error.context,
        });
        break;
      }
      default: {
        log.debug(error);
      }
    }
  });
}

export function* logSuccessfulBindings(
  unEvalTree: UnEvalTree,
  dataTree: DataTree,
  evaluationOrder: string[],
  isCreateFirstTree: boolean,
) {
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  if (appMode === APP_MODE.PUBLISHED) return;
  if (!evaluationOrder) return;

  if (isCreateFirstTree) {
    // we only aim to log binding success which were added by user
    // for first evaluation, bindings are not added by user hence skipping it.
    return;
  }
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

      const hasErrors = errors.length > 0;

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

export function* postEvalActionDispatcher(actions: Array<AnyReduxAction>) {
  for (const action of actions) {
    yield put(action);
  }
}

// We update the data tree definition after every eval so that autocomplete
// is accurate
export function* updateTernDefinitions(
  dataTree: DataTree,
  updates: DataTreeDiff[],
  isCreateFirstTree: boolean,
  jsData: Record<string, unknown> = {},
) {
  const shouldUpdate: boolean =
    isCreateFirstTree ||
    some(updates, (update) => {
      if (update.event === DataTreeDiffEvent.NEW) return true;
      if (update.event === DataTreeDiffEvent.DELETE) return true;
      if (update.event === DataTreeDiffEvent.EDIT) return false;
      const { entityName } = getEntityNameAndPropertyPath(
        update.payload.propertyPath,
      );
      const entity = dataTree[entityName];
      if (!entity || !isWidget(entity)) return false;
      return isWidgetPropertyNamePath(entity, update.payload.propertyPath);
    });

  if (!shouldUpdate) return;
  const start = performance.now();
  // remove private and suppressAutoComplete widgets from dataTree used for autocompletion
  const dataTreeForAutocomplete = getDataTreeForAutocomplete(dataTree);
  const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
  const { def, entityInfo } = dataTreeTypeDefCreator(
    dataTreeForAutocomplete,
    !!featureFlags.JS_EDITOR,
    jsData,
  );
  CodemirrorTernService.updateDef("DATA_TREE", def, entityInfo);
  const end = performance.now();
  log.debug("Tern", { updates });
  log.debug("Tern definitions updated took ", (end - start).toFixed(2));
}

export function* handleJSFunctionExecutionErrorLog(
  collectionId: string,
  collectionName: string,
  action: JSAction,
  errors: any[],
) {
  errors.length
    ? AppsmithConsole.addErrors([
        {
          payload: {
            id: `${collectionId}-${action.id}`,
            logType: LOG_TYPE.EVAL_ERROR,
            text: `${createMessage(JS_EXECUTION_FAILURE)}: ${collectionName}.${
              action.name
            }`,
            messages: errors.map((error) => {
              // TODO: Remove this check once we address uncaught promise errors
              let errorMessage = error.errorMessage;
              if (!errorMessage) {
                const errMsgArr = error.message.split(":");
                errorMessage = errMsgArr.length
                  ? {
                      name: errMsgArr[0],
                      message: errMsgArr.slice(1).join(":"),
                    }
                  : {
                      name: "ValidationError",
                      message: error.message,
                    };
              }
              return {
                message: errorMessage,
                type: PLATFORM_ERROR.JS_FUNCTION_EXECUTION,
                subType: error.errorType,
              };
            }),
            source: {
              id: action.collectionId ? action.collectionId : action.id,
              name: `${collectionName}.${action.name}`,
              type: ENTITY_TYPE.JSACTION,
              propertyPath: `${collectionName}.${action.name}`,
            },
          },
        },
      ])
    : AppsmithConsole.deleteErrors([{ id: `${collectionId}-${action.id}` }]);
}
