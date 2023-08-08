import type { Log } from "entities/AppsmithConsole";
import {
  ENTITY_TYPE,
  PLATFORM_ERROR,
  Severity,
} from "entities/AppsmithConsole";
import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  DataTreeDiffEvent,
  getDataTreeForAutocomplete,
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { EvalError, EvaluationError } from "utils/DynamicBindingUtils";
import { EvalErrorTypes, getEvalErrorPath } from "utils/DynamicBindingUtils";
import { find, get, some } from "lodash";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { call, put, select } from "redux-saga/effects";
import type { AnyReduxAction } from "@appsmith/constants/ReduxActionConstants";
import AppsmithConsole from "utils/AppsmithConsole";
import * as Sentry from "@sentry/react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  ERROR_EVAL_ERROR_GENERIC,
  JS_EXECUTION_FAILURE,
  JS_OBJECT_BODY_INVALID,
  VALUE_IS_INVALID,
} from "@appsmith/constants/messages";
import log from "loglevel";
import type { AppState } from "@appsmith/reducers";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import type { JSAction } from "entities/JSCollection";
import { isWidgetPropertyNamePath } from "utils/widgetEvalUtils";
import { toast } from "design-system";
import type { ActionEntityConfig } from "entities/DataTree/types";
import type { SuccessfulBindings } from "utils/SuccessfulBindingsMap";
import SuccessfulBindingMap from "utils/SuccessfulBindingsMap";
import { logActionExecutionError } from "./ActionExecution/errorUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import type {
  EvalTreeResponseData,
  JSVarMutatedEvents,
} from "workers/Evaluation/types";

let successfulBindingsMap: SuccessfulBindingMap | undefined;

const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;

function logLatestEvalPropertyErrors(
  currentDebuggerErrors: Record<string, Log>,
  dataTree: DataTree,
  evalAndValidationOrder: Array<string>,
  configTree: ConfigTree,
  removedPaths?: Array<{ entityId: string; fullpath: string }>,
) {
  const errorsToAdd = [];
  const errorsToDelete = [];
  const updatedDebuggerErrors: Record<string, Log> = {
    ...currentDebuggerErrors,
  };

  for (const evaluatedPath of evalAndValidationOrder) {
    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(evaluatedPath);
    const entity = dataTree[entityName];
    const entityConfig = configTree[entityName] as any;

    if (isWidget(entity) || isAction(entity) || isJSAction(entity)) {
      if (
        entityConfig?.logBlackList &&
        propertyPath in entityConfig?.logBlackList
      ) {
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
        ? entityConfig.pluginType
        : entity.type;
      const iconId = isWidget(entity)
        ? entity.widgetId
        : isJSAction(entity)
        ? entity.actionId
        : entityConfig.pluginId;
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

  if (removedPaths?.length) {
    for (const removedPath of removedPaths) {
      const { entityId, fullpath } = removedPath;
      const { propertyPath } = getEntityNameAndPropertyPath(fullpath);
      errorsToDelete.push({ id: `${entityId}-${propertyPath}` });
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
  reValidatedPaths?: Array<string>,
  configTree?: ConfigTree,
  removedPaths?: Array<{ entityId: string; fullpath: string }>,
) {
  if (dataTree && evaluationOrder && configTree && reValidatedPaths) {
    const currentDebuggerErrors: Record<string, Log> = yield select(
      getDebuggerErrors,
    );

    const evalAndValidationOrder = new Set([
      ...reValidatedPaths,
      ...evaluationOrder,
    ]);
    // Update latest errors to the debugger
    logLatestEvalPropertyErrors(
      currentDebuggerErrors,
      dataTree,
      [...evalAndValidationOrder],
      configTree,
      removedPaths,
    );
  }

  errors.forEach((error) => {
    switch (error.type) {
      case EvalErrorTypes.CYCLICAL_DEPENDENCY_ERROR: {
        if (error.context) {
          // Add more info about node for the toast
          const { dependencyMap, diffs, entityType, node } = error.context;
          toast.show(`${error.message} Node was: ${node}`, {
            kind: "error",
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
        toast.show(createMessage(ERROR_EVAL_ERROR_GENERIC), {
          kind: "error",
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
        /*
         * https://github.com/appsmithorg/appsmith/issues/2654
         * This code is being commented out to prevent these errors from going to Sentry
         * till we come up with a more definitive solution to prevent this error
         * Proposed solution - adding lint errors to editor to prevent these from happening
         * */

        // Sentry.captureException(new Error(error.message), {
        //   extra: {
        //     request: error.context,
        //   },
        // });
        break;
      }
      case EvalErrorTypes.PARSE_JS_ERROR: {
        toast.show(`${error.message} at: ${error.context?.entity.name}`, {
          kind: "error",
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

export function* logJSVarCreatedEvent(
  jsVarsCreatedEvent: EvalTreeResponseData["jsVarsCreatedEvent"],
) {
  if (!jsVarsCreatedEvent) return;

  jsVarsCreatedEvent.forEach(({ path, type }) => {
    AnalyticsUtil.logEvent("JS_VARIABLE_CREATED", {
      path,
      type,
    });
  });
}

export function* logJSVarMutationEvent(
  jsVarsMutationEvent: JSVarMutatedEvents,
) {
  Object.values(jsVarsMutationEvent).forEach(({ path, type }) => {
    AnalyticsUtil.logEvent("JS_VARIABLE_MUTATED", {
      path,
      type,
    });
  });
}

export function* dynamicTriggerErrorHandler(errors: any[]) {
  if (errors.length > 0) {
    for (const error of errors) {
      const errorMessage =
        error.errorMessage.message.message || error.errorMessage.message;
      yield call(logActionExecutionError, errorMessage, true);
    }
  }
}

export function* logSuccessfulBindings(
  unEvalTree: UnEvalTree,
  dataTree: DataTree,
  evaluationOrder: string[],
  isCreateFirstTree: boolean,
  isNewWidgetAdded: boolean,
  configTree: ConfigTree,
  undefinedEvalValuesMap: Record<string, boolean>,
) {
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  if (appMode === APP_MODE.PUBLISHED) return;
  if (!evaluationOrder) return;

  const successfulBindingPaths: SuccessfulBindings = !successfulBindingsMap
    ? {}
    : { ...successfulBindingsMap.get() };

  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const instanceId: string = yield select(getInstanceId);

  evaluationOrder.forEach((evaluatedPath) => {
    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(evaluatedPath);
    const entity = dataTree[entityName];
    const entityConfig = configTree[entityName] as
      | WidgetEntityConfig
      | ActionEntityConfig;
    if (isAction(entity) || isWidget(entity)) {
      const unevalValue = get(unEvalTree, evaluatedPath);
      let isUndefined = false;

      isUndefined = get(undefinedEvalValuesMap, evaluatedPath) || false;

      const entityType = isAction(entity)
        ? entityConfig.pluginType
        : entity.type;
      const isABinding = find(entityConfig.dynamicBindingPathList, {
        key: propertyPath,
      });

      const logBlackList = entityConfig.logBlackList;

      if (!isABinding || propertyPath in logBlackList) {
        /**Remove the binding from the map so that in case it is added again, we log it*/
        if (successfulBindingPaths[evaluatedPath]) {
          delete successfulBindingPaths[evaluatedPath];
        }
        return;
      }

      /** All the paths that are added when a new widget is added needs to be added to the map so that
       * we don't log them again unless they are changed by the user.
       */
      if (isNewWidgetAdded) {
        successfulBindingPaths[evaluatedPath] = unevalValue;
        return;
      }

      const errors: EvaluationError[] = get(
        dataTree,
        getEvalErrorPath(evaluatedPath),
        [],
      ) as EvaluationError[];

      const hasErrors = errors.length > 0;
      if (!hasErrors) {
        if (!isCreateFirstTree) {
          /**Log the binding only if it doesn't already exist */
          if (
            !successfulBindingPaths[evaluatedPath] ||
            (successfulBindingPaths[evaluatedPath] &&
              successfulBindingPaths[evaluatedPath] !== unevalValue)
          ) {
            AnalyticsUtil.logEvent("ENTITY_BINDING_SUCCESS", {
              unevalValue,
              entityType,
              propertyPath,
              isUndefined,
              orgId: workspaceId,
              instanceId,
            });
          }
        }

        successfulBindingPaths[evaluatedPath] = unevalValue;
      } else {
        /**Remove the binding from the map so that in case it is added again, we log it*/
        if (successfulBindingPaths[evaluatedPath]) {
          delete successfulBindingPaths[evaluatedPath];
        }
      }
    }
  });

  if (!successfulBindingsMap) {
    successfulBindingsMap = new SuccessfulBindingMap(successfulBindingPaths);
  } else {
    successfulBindingsMap.set(successfulBindingPaths);
  }
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
  configTree: ConfigTree,
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
  const dataTreeForAutocomplete = getDataTreeForAutocomplete(
    dataTree,
    configTree,
  );
  const { def, entityInfo } = dataTreeTypeDefCreator(
    dataTreeForAutocomplete,
    jsData,
    configTree,
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
