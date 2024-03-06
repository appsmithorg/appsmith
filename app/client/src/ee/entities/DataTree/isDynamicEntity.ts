export * from "ce/entities/DataTree/isDynamicEntity";
import {
  isDynamicEntity as CE_isDynamicEntity,
  type DynamicEntityType as CE_DynamicEntityType,
} from "ce/entities/DataTree/isDynamicEntity";
import type {
  DataTreeEntityConfig,
  ModuleInputsEntity,
  ModuleInstanceEntity,
} from "@appsmith/entities/DataTree/types";
import {
  type EntityTypeValue,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export function isDynamicEntity(
  entity: DataTreeEntity | DataTreeEntityConfig,
): entity is CE_DynamicEntityType | ModuleInputsEntity | ModuleInstanceEntity {
  return (
    (
      [
        ENTITY_TYPE.MODULE_INPUT,
        ENTITY_TYPE.MODULE_INSTANCE,
      ] as Array<EntityTypeValue>
    ).includes(entity.ENTITY_TYPE) || CE_isDynamicEntity(entity)
  );
}
