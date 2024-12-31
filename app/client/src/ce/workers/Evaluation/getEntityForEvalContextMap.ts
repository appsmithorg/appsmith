import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { getJSActionForEvalContext } from "ee/workers/Evaluation/getJSActionForEvalContext";

export const getEntityForEvalContextMap: Record<
  string,
  (entityName: string, entity: DataTreeEntity) => unknown
> = {
  [ENTITY_TYPE.JSACTION]: (entityName, entity) => {
    return getJSActionForEvalContext(entityName, entity);
  },
};
