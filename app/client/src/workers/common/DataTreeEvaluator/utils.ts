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

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
): entity is DataTreeAction | DataTreeJSAction | DataTreeWidget {
  return isWidget(entity) || isAction(entity) || isJSAction(entity);
}
