import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { getJSActionForEvalContext } from "workers/Evaluation/getJSActionForEvalContext";

export const getEntityForEvalContextMap: Record<
  string,
  (entityName: string, entity: DataTreeEntity) => unknown
> = {
  [ENTITY_TYPE_VALUE.JSACTION]: (entityName, entity) => {
    return getJSActionForEvalContext(entityName, entity);
  },
};
