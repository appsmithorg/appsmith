import {
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  EXECUTION_PARAM_REFERENCE_REGEX,
  THIS_DOT_PARAMS_KEY,
} from "constants/AppsmithActionConstants/ActionConstants";
import type {
  ConfigTree,
  DataTreeEntity,
  WidgetEntity,
} from "entities/DataTree/dataTreeFactory";
import type { ActionEntity, JSActionEntity } from "entities/DataTree/types";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { errorModifier } from "workers/Evaluation/errorModifier";
import { asyncJsFunctionInDataFields } from "workers/Evaluation/JSObject/asyncJSFunctionBoundToDataField";

export function getFixedTimeDifference(endTime: number, startTime: number) {
  return (endTime - startTime).toFixed(2) + " ms";
}
export function isDataField(fullPath: string, configTree: ConfigTree) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entityConfig = configTree[entityName];
  if (entityConfig && "triggerPaths" in entityConfig) {
    return !(propertyPath in entityConfig.triggerPaths);
  }
  return false;
}

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
): entity is ActionEntity | WidgetEntity | JSActionEntity {
  return isWidget(entity) || isAction(entity) || isJSAction(entity);
}

export function addRootcauseToAsyncInvocationErrors(
  fullPropertyPath: string,
  configTree: ConfigTree,
  errors: EvaluationError[],
) {
  let updatedErrors = errors;

  if (isDataField(fullPropertyPath, configTree)) {
    const asyncFunctionBindingInPath =
      asyncJsFunctionInDataFields.getAsyncFunctionBindingInDataField(
        fullPropertyPath,
      );
    if (asyncFunctionBindingInPath) {
      updatedErrors = errorModifier.setAsyncInvocationErrorsRootcause(
        errors,
        asyncFunctionBindingInPath,
      );
    }
  }
  return updatedErrors;
}

export function replaceThisDotParams(code: string) {
  return code.replace(EXECUTION_PARAM_REFERENCE_REGEX, THIS_DOT_PARAMS_KEY);
}
