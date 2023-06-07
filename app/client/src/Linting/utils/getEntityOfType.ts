import type { TEntity } from "Linting/lib/entity";
import type { ENTITY_TYPE } from "entities/DataTree/types";
import type { createEntityTree } from "./entityTree";

export function getEntitiesOfType<T extends TEntity>(
  type: ENTITY_TYPE,
  entityTree: ReturnType<typeof createEntityTree>,
) {
  const entitiesOfType: Record<string, T> = {};
  for (const entityName of Object.keys(entityTree)) {
    if (entityTree[entityName].getType() == type) {
      entitiesOfType[entityName] = entityTree[entityName] as T;
    }
  }
  return entitiesOfType;
}
