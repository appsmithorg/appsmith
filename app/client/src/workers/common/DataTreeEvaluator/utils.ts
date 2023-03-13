import {
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeJSAction,
  DataTreeWidget,
} from "entities/DataTree/dataTreeFactory";
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

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
): entity is DataTreeAction | DataTreeJSAction | DataTreeWidget {
  return isWidget(entity) || isAction(entity) || isJSAction(entity);
}
