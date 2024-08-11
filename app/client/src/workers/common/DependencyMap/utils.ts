import { find, union } from "lodash";
import {
  getEntityNameAndPropertyPath,
  isJSActionConfig,
  isWidget,
} from "ee/workers/Evaluation/evaluationUtils";

import type { WidgetEntityConfig } from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";

/**This function returns a unique array containing a merge of both arrays
 * @param currentArr
 * @param updateArr
 * @returns A unique array containing a merge of both arrays
 */
export const mergeArrays = <T>(currentArr: T[], updateArr: T[]): T[] => {
  if (!currentArr) return updateArr;
  return union(currentArr, updateArr);
};

export function isADynamicTriggerPath(
  entity: DataTreeEntity,
  propertyPath: string,
  entityConfig: WidgetEntityConfig,
) {
  if (isWidget(entity)) {
    const dynamicTriggerPathlist = entityConfig?.dynamicTriggerPathList;
    const isTriggerPath = find(dynamicTriggerPathlist, { key: propertyPath });
    if (isTriggerPath) {
      return true;
    }
    return false;
  }
}

export function isJSFunction(configTree: ConfigTree, fullPath: string) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entityConfig = configTree[entityName];
  return (
    isJSActionConfig(entityConfig) &&
    propertyPath &&
    propertyPath in entityConfig.meta
  );
}
export function convertArrayToObject(arr: string[]) {
  return arr.reduce(
    (acc, item) => {
      return { ...acc, [item]: true } as const;
    },
    {} as Record<string, true>,
  );
}
