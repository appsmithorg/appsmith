export * from "ce/entities/AppsmithConsole/utils";
import {
  ENTITY_TYPE as CE_ENTITY_TYPE,
  PLATFORM_ERROR as CE_PLATFORM_ERROR,
} from "ce/entities/AppsmithConsole/utils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type {
  DataTreeEntityConfig,
  ModuleInstanceEntityConfig,
} from "../DataTree/types";
import { isModuleInstance } from "@appsmith/workers/Evaluation/evaluationUtils";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { type Message, Severity } from "entities/AppsmithConsole";

export enum EE_ENTITY_TYPE {
  MODULE_INPUT = "MODULE_INPUT",
  MODULE_INSTANCE = "MODULE_INSTANCE",
}

export const ENTITY_TYPE = {
  ...CE_ENTITY_TYPE,
  ...EE_ENTITY_TYPE,
};

enum EE_PLATFORM_ERROR {
  MISSING_ENTITY = "MISSING_ENTITY",
}

export const PLATFORM_ERROR = {
  ...CE_PLATFORM_ERROR,
  ...EE_PLATFORM_ERROR,
};

export type ENTITY_TYPE = CE_ENTITY_TYPE | EE_ENTITY_TYPE;
export type PLATFORM_ERROR = CE_PLATFORM_ERROR | EE_PLATFORM_ERROR;

export const getModuleInstanceInvalidErrors = (
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  propertyPath: string,
) => {
  const errorsToAdd = [];
  if (!propertyPath && isModuleInstance(entity)) {
    const instanceConfig = entityConfig as ModuleInstanceEntityConfig;
    const debuggerKey = entityConfig.name;

    const messages: Array<Message> = [];

    if (!!instanceConfig.invalids.length) {
      instanceConfig.invalids.forEach((invalid) => {
        messages.push({
          message: {
            name: "MissingModuleError",
            message: invalid,
          },
          type: PLATFORM_ERROR.MISSING_ENTITY,
          subType: "",
        });
      });
    }

    errorsToAdd.push({
      payload: {
        id: debuggerKey,
        iconId: "",
        logType: LOG_TYPE.MISSING_MODULE,
        text: `Package Error: Unable to load module ${entityConfig.name}`,
        messages: messages,
        source: {
          id: entity.moduleInstanceId,
          name: entityConfig.name,
          type: entity.ENTITY_TYPE as ENTITY_TYPE,
          propertyPath: entityConfig.name,
        },
      },
      severity: Severity.ERROR,
    });
  }
  return errorsToAdd;
};
