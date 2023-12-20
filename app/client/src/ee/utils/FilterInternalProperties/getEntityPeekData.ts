export * from "ce/utils/FilterInternalProperties/getEntityPeekData";

import { getEntityPeekData as CE_getEntityPeekData } from "ce/utils/FilterInternalProperties/getEntityPeekData";
import { getModuleInputsPeekData, getModuleInstancePeekData } from "./Modules";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

export const getEntityPeekData: typeof CE_getEntityPeekData = {
  ...CE_getEntityPeekData,
  [ENTITY_TYPE.MODULE_INPUT]: ({ dataTreeEntity }) => {
    return getModuleInputsPeekData(dataTreeEntity);
  },
  [ENTITY_TYPE.MODULE_INSTANCE]: ({
    configTree,
    dataTree,
    dataTreeEntity,
    objectName,
  }) => {
    return getModuleInstancePeekData(
      configTree,
      dataTree,
      dataTreeEntity,
      objectName,
    );
  },
};
