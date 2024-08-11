import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { isWidgetActionOrJsObject } from "ee/entities/DataTree/utils";
import { getPathDependencies } from "ee/workers/common/DependencyMap/utils/getEntityDependenciesByType";
import type { DataTreeEntityConfig } from "ee/entities/DataTree/types";

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
      entityConfig as DataTreeEntityConfig,
      fullPropertyPath as string,
      allKeys as Record<string, true>,
    ) || []
  );
}
