import { getEntityForEvalContextMap } from "ee/workers/Evaluation/getEntityForEvalContextMap";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export function getEntityForEvalContext(
  entity: DataTreeEntity,
  entityName: string,
) {
  const getterMethod = getEntityForEvalContextMap[entity.ENTITY_TYPE];

  if (!getterMethod) return entity;

  return getterMethod(entityName, entity);
}
