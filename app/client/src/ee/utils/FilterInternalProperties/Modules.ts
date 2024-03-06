import type {
  JSModuleInstanceEntity,
  JSModuleInstanceEntityConfig,
  ModuleInputsEntity,
  QueryModuleInstanceEntity,
} from "@appsmith/entities/DataTree/types";
import {
  isJSModuleInstance,
  isQueryModuleInstance,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import { omit } from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import { ModuleInstanceDefMap } from "../autocomplete/EntityDefinitions";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const getModuleInputsPeekData = (dataTreeEntity: DataTreeEntity) => {
  const peekData = omit(dataTreeEntity as ModuleInputsEntity, [
    "ENTITY_TYPE",
    EVALUATION_PATH,
  ]);

  return peekData;
};

export const getModuleInstancePeekData = (
  configTree: ConfigTree,
  dataTree: DataTree,
  dataTreeEntity: DataTreeEntity,
  objectName: string,
) => {
  if (isQueryModuleInstance(dataTreeEntity)) {
    const queryModuleInstance = dataTree[
      objectName
    ] as QueryModuleInstanceEntity;
    if (queryModuleInstance) {
      const definitions =
        ModuleInstanceDefMap[MODULE_TYPE.QUERY](queryModuleInstance);
      const peekData: Record<string, unknown> = {};
      Object.keys(definitions).forEach((key) => {
        if (key.indexOf("!") === -1) {
          if (key === "data" || key === "isLoading") {
            peekData[key] = queryModuleInstance[key];
          } else if (key === "run" || key === "clear") {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            peekData[key] = function () {}; // tern inference required here
          }
        }
      });
      return peekData;
    }
  } else if (isJSModuleInstance(dataTreeEntity)) {
    const JSModuleInstance = dataTree[objectName] as JSModuleInstanceEntity;
    const JSModuleInstanceConfig = configTree[
      objectName
    ] as JSModuleInstanceEntityConfig;
    const metaObj = JSModuleInstanceConfig.meta;
    const variables = JSModuleInstanceConfig.variables;
    const peekData: Record<string, unknown> = {};
    for (const funcName in metaObj) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      peekData[funcName] = function () {};
    }
    for (const item in variables) {
      peekData[variables[item]] = JSModuleInstance[variables[item]];
    }
    return peekData;
  }
};
