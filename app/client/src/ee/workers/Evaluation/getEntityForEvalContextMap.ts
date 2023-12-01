export * from "ce/workers/Evaluation/getEntityForEvalContextMap";

import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { getEntityForEvalContextMap as CE_getEntityForEvalContextMap } from "ce/workers/Evaluation/getEntityForEvalContextMap";
import { getModuleInstanceForEvalContext } from "./getModuleInstanceForEvalContext";
import type { QueryModuleInstanceEntity } from "@appsmith/entities/DataTree/types";

export const getEntityForEvalContextMap: Record<
  string,
  (entityName: string, entity: DataTreeEntity) => unknown
> = {
  ...CE_getEntityForEvalContextMap,
  [ENTITY_TYPE_VALUE.MODULE_INSTANCE]: (entityName, entity) => {
    return getModuleInstanceForEvalContext(
      entityName,
      entity as QueryModuleInstanceEntity,
    );
  },
};
