import type { JSActionEntity } from "@appsmith/entities/DataTree/types";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

const entityUniqueIdGetterMap: Record<
  string,
  (entity: DataTreeEntity) => string
> = {
  [ENTITY_TYPE_VALUE.JSACTION]: (entity) => {
    return (entity as JSActionEntity).actionId;
  },
};

export default function getEntityUniqueIdForLogs(entity: DataTreeEntity) {
  const getUniqueId = entityUniqueIdGetterMap[entity.ENTITY_TYPE];

  if (!getUniqueId) return "";

  return getUniqueId(entity);
}
