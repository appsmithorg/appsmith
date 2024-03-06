export * from "ce/workers/Evaluation/evaluationUtils";
import type {
  ModuleInputsEntity,
  DataTreeEntityConfig,
  ModuleInstanceEntity,
  JSModuleInstanceEntity,
  QueryModuleInstanceEntity,
} from "@appsmith/entities/DataTree/types";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import {
  isAPathDynamicBindingPath as CE_isAPathDynamicBindingPath,
  isAnyJSAction as CE_isAnyJSAction,
  isNotEntity as CE_isNotEntity,
  isEntityAction as CE_isEntityAction,
} from "ce/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export function isModuleInput(
  entity: DataTreeEntity,
): entity is ModuleInputsEntity {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.MODULE_INPUT
  );
}

export function isQueryModuleInstance(
  entity: DataTreeEntity,
): entity is QueryModuleInstanceEntity {
  return (
    isModuleInstance(entity) &&
    "type" in entity &&
    entity.type === MODULE_TYPE.QUERY
  );
}

export function isModuleInstance(
  entity: DataTreeEntity,
): entity is ModuleInstanceEntity {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.MODULE_INSTANCE
  );
}

export function isJSModuleInstance(
  entity: DataTreeEntity,
): entity is JSModuleInstanceEntity {
  return (
    isModuleInstance(entity) &&
    "type" in entity &&
    entity.type === MODULE_TYPE.JS
  );
}

export const isModuleInputDynamic = (
  entity: DataTreeEntity,
  propertyPath: string,
) => {
  if (isModuleInput(entity)) {
    const moduleInput = entity as ModuleInputsEntity;
    return (
      !!propertyPath && isDynamicValue(moduleInput[propertyPath] as string)
    );
  }
  return false;
};

export const isAPathDynamicBindingPath = (
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  propertyPath: string,
): boolean => {
  return (
    CE_isAPathDynamicBindingPath(entity, entityConfig, propertyPath) ||
    isModuleInputDynamic(entity, propertyPath)
  );
};

/**
 *
 * isAnyJSAction checks if the entity is a JSAction ( or a JSModuleInstance on EE )
 */
export function isAnyJSAction(entity: DataTreeEntity) {
  return CE_isAnyJSAction(entity) || isJSModuleInstance(entity);
}

export const isNotEntity = (entity: DataTreeEntity) => {
  return (
    CE_isNotEntity(entity) &&
    !isModuleInput(entity) &&
    !isModuleInstance(entity)
  );
};

export const isEntityAction = (entity: DataTreeEntity) => {
  return CE_isEntityAction(entity) || isQueryModuleInstance(entity);
};
