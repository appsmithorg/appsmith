import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import type {
  WidgetEntity,
  WidgetEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  DataTreeDiffEvent,
  getDataTreeForAutocomplete,
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getEvalErrorPath } from "utils/DynamicBindingUtils";
import { find, get, some } from "lodash";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { call, put, select } from "redux-saga/effects";
import type { AnyReduxAction } from "@appsmith/constants/ReduxActionConstants";
import AppsmithConsole from "utils/AppsmithConsole";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  JS_EXECUTION_FAILURE,
} from "@appsmith/constants/messages";
import log from "loglevel";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { isWidgetPropertyNamePath } from "utils/widgetEvalUtils";
import type { ActionEntityConfig } from "@appsmith/entities/DataTree/types";
import type { SuccessfulBindings } from "utils/SuccessfulBindingsMap";
import SuccessfulBindingMap from "utils/SuccessfulBindingsMap";
import { logActionExecutionError } from "./ActionExecution/errorUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import type {
  EvalTreeResponseData,
  JSVarMutatedEvents,
} from "workers/Evaluation/types";
import { endSpan, startRootSpan } from "UITelemetry/generateTraces";

let successfulBindingsMap: SuccessfulBindingMap | undefined;

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
  const span = startRootSpan("updateTernDefinitions");
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
      return isWidgetPropertyNamePath(
        entity as WidgetEntity,
        update.payload.propertyPath,
      );
    });

  if (!shouldUpdate) {
    endSpan(span);
    return;
  }
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
  endSpan(span);
}

export function* handleJSFunctionExecutionErrorLog(
  action: JSAction,
  collection: JSCollection,
  errors: any[],
) {
  const { id: collectionId, name: collectionName } = collection;

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
              name: collectionName,
              type: ENTITY_TYPE.JSACTION,
              propertyPath: `${action.name}`,
            },
          },
        },
      ])
    : AppsmithConsole.deleteErrors([{ id: `${collectionId}-${action.id}` }]);
}
