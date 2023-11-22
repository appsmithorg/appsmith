export * from "ce/utils/FilterInternalProperties/getEntityPeekData";

import { getEntityPeekData as CE_getEntityPeekData } from "ce/utils/FilterInternalProperties/getEntityPeekData";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import { getModuleInputsPeekData } from "./ModuleInputs";

export const getEntityPeekData: typeof CE_getEntityPeekData = {
  ...CE_getEntityPeekData,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: ({ dataTreeEntity }) => {
    return getModuleInputsPeekData(dataTreeEntity);
  },
};
