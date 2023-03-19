import {
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeJSAction,
  DataTreeWidget,
} from "entities/DataTree/dataTreeFactory";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { errorModifier } from "workers/Evaluation/errorModifier";
import { asyncJsFunctionInDataFields } from "workers/Evaluation/JSObject/asyncJsFunctionInDataField";

export function getFixedTimeDifference(endTime: number, startTime: number) {
  return (endTime - startTime).toFixed(2) + " ms";
}
export function isDataField(fullPath: string, unevalTree: DataTree) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entity = unevalTree[entityName];
  if ("triggerPaths" in entity) {
    return !(propertyPath in entity.triggerPaths);
  }
  return false;
}

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
): entity is DataTreeAction | DataTreeJSAction | DataTreeWidget {
  return isWidget(entity) || isAction(entity) || isJSAction(entity);
}

export function addRootcauseToAsyncInvocationErrors(
  fullPropertyPath: string,
  unevalTree: DataTree,
  errors: EvaluationError[],
) {
  let updatedErrors = errors;

  if (isDataField(fullPropertyPath, unevalTree)) {
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
