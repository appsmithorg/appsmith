import type { Log } from "entities/AppsmithConsole";
import {
  getModuleInstanceInvalidErrors,
  type ENTITY_TYPE,
} from "ee/entities/AppsmithConsole/utils";
import { Severity } from "entities/AppsmithConsole";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "ee/workers/Evaluation/evaluationUtils";
import type { EvalError, EvaluationError } from "utils/DynamicBindingUtils";
import { EvalErrorTypes, getEvalErrorPath } from "utils/DynamicBindingUtils";
import { get } from "lodash";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { select } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  createMessage,
  ERROR_EVAL_ERROR_GENERIC,
  JS_OBJECT_BODY_INVALID,
  VALUE_IS_INVALID,
} from "ee/constants/messages";
import log from "loglevel";
import type { AppState } from "ee/reducers";
import { toast } from "@appsmith/ads";
import { isDynamicEntity } from "ee/entities/DataTree/isDynamicEntity";
import { getEntityPayloadInfo } from "ee/utils/getEntityPayloadInfo";
import { captureException } from "instrumentation";

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
    const entityConfig = configTree[entityName];

    if (!entity || !entityConfig || !isDynamicEntity(entity)) continue;

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logBlackList = (entityConfig as any)?.logBlackList;

    if (logBlackList && propertyPath in logBlackList) continue;

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

    const entityType = entity.ENTITY_TYPE as string;
    const payloadInfo = getEntityPayloadInfo[entityType](entityConfig);
    const entityNameToDisplay = payloadInfo.entityName || entityName;

    const moduleInstanceErrors = getModuleInstanceInvalidErrors(
      entity,
      entityConfig,
      propertyPath,
    );

    if (moduleInstanceErrors.length) {
      moduleInstanceErrors.forEach((instanceError) => {
        errorsToAdd.push(instanceError);
      });
    }

    if (!payloadInfo) continue;

    const debuggerKeys = [
      {
        key: `${payloadInfo.id}-${propertyPath}`,
        errors: evalErrors,
      },
      {
        key: `${payloadInfo.id}-${propertyPath}-warning`,
        errors: evalWarnings,
        isWarning: true,
      },
    ];

    const httpMethod =
      isAction(entity) && entity.config
        ? get(entity.config, "httpMethod")
        : undefined;

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
          : entityNameToDisplay;

        // Add or update
        if (
          !isJSAction(entity) ||
          (isJSAction(entity) && propertyPath === "body")
        ) {
          errorsToAdd.push({
            payload: {
              id: debuggerKey,
              iconId: payloadInfo.iconId,
              logType: isWarning ? LOG_TYPE.EVAL_WARNING : LOG_TYPE.EVAL_ERROR,
              // Unless the intention is to change the message shown in the debugger please do not
              // change the text shown here
              text: isJSAction(entity)
                ? createMessage(JS_OBJECT_BODY_INVALID)
                : createMessage(VALUE_IS_INVALID, propertyPath),
              messages: errorMessages,
              source: {
                id: payloadInfo.id,
                name: entityNameToDisplay,
                type: entityType as ENTITY_TYPE,
                propertyPath: logPropertyPath,
                pluginType: payloadInfo.pluginType,
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
  configTree?: ConfigTree,
  removedPaths?: Array<{ entityId: string; fullpath: string }>,
) {
  if (dataTree && evaluationOrder && configTree) {
    const currentDebuggerErrors: Record<string, Log> =
      yield select(getDebuggerErrors);

    // Update latest errors to the debugger
    logLatestEvalPropertyErrors(
      currentDebuggerErrors,
      dataTree,
      evaluationOrder,
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

          if (error.context.logToMonitoring) {
            // Send the generic error message to monitoring for better grouping
            captureException(new Error(error.message), {
              context: {
                node,
                entityType,
                dependencyMap,
                diffs,
              },
            });
          }

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
        captureException(error);
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
        captureException(new Error(error.message), {
          context: error.context,
        });
        break;
      }
      default: {
        log.debug(error);
      }
    }
  });
}
