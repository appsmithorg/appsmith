import type { ModuleInputsEntity } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { omit } from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";

export const getModuleInputsPeekData = (dataTreeEntity: DataTreeEntity) => {
  const peekData = omit(dataTreeEntity as ModuleInputsEntity, [
    "ENTITY_TYPE",
    EVALUATION_PATH,
  ]);

  return peekData;
};
