import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { get } from "lodash";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { isWidgetActionOrJsObject } from "ee/entities/DataTree/utils";
import type { DataTreeEntityObject } from "ee/entities/DataTree/types";
import {
  getDependencies,
  getPathDependencies,
} from "ee/workers/common/DependencyMap/utils/getEntityDependenciesByType";
import type { DataTreeEntityConfig } from "ee/entities/DataTree/types";

export function getEntityDependencies(
  entity: DataTreeEntityObject,
  entityConfig: DataTreeEntityConfig,
  allKeys: Record<string, true>,
): Record<string, string[]> {
  if (!isWidgetActionOrJsObject(entity)) return {};

  return (
    getDependencies[entity.ENTITY_TYPE](
      entity as DataTreeEntityObject,
      entityConfig,
      allKeys,
    ) || {}
  );
}

export function getEntityPathDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  fullPropertyPath: string,
  allKeys: Record<string, true>,
) {
  if (!isWidgetActionOrJsObject(entity)) return [];

  return (
    getPathDependencies[entity.ENTITY_TYPE](
      entity as DataTreeEntity,
      entityConfig,
      fullPropertyPath,
      allKeys,
    ) || []
  );
}

export function getDependencyFromEntityPath(
  propertyPath: string,
  entity: DataTreeEntity,
) {
  const unevalPropValue = get(entity, propertyPath, "").toString();
  const { jsSnippets } = getDynamicBindings(unevalPropValue, entity);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  return validJSSnippets;
}
