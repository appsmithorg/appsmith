import {
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";

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
