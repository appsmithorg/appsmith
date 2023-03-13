import {
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { DependencyMap } from "utils/DynamicBindingUtils";

export function getFixedTimeDifference(endTime: number, startTime: number) {
  return (endTime - startTime).toFixed(2) + " ms";
}
export function isDataField(fullPath: string, unevalTree: DataTree) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entity = unevalTree[entityName];
  if (isWidget(entity)) {
    return !(propertyPath in entity.triggerPaths);
  }
  return isAction(entity);
}

export function hasAsyncBinding(
  asyncFunctionsInSyncFields: DependencyMap,
  fullPath: string,
) {
  let hasAsyncFunctionInvocation = undefined;
  Object.keys(asyncFunctionsInSyncFields).forEach((path) => {
    if (asyncFunctionsInSyncFields[path].includes(fullPath)) {
      return (hasAsyncFunctionInvocation = path);
    }
  });

  return hasAsyncFunctionInvocation;
}
