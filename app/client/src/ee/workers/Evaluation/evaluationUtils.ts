export * from "ce/workers/Evaluation/evaluationUtils";
import type {
  ModuleInputsEntity,
  DataTreeEntityConfig,
} from "@appsmith/entities/DataTree/types";
import { ENTITY_TYPE_VALUE } from "@appsmith/entities/DataTree/types";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { isAPathDynamicBindingPath as CE_isAPathDynamicBindingPath } from "ce/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export function isModuleInput(
  entity: DataTreeEntity,
): entity is ModuleInputsEntity {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE_VALUE.MODULE_INPUT
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
