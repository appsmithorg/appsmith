export * from "ce/entities/DataTree/isDynamicEntity";
import {
  isDynamicEntity as CE_isDynamicEntity,
  type DynamicEntityType as CE_DynamicEntityType,
} from "ce/entities/DataTree/isDynamicEntity";
import type {
  DataTreeEntityConfig,
  ModuleInputsEntity,
} from "@appsmith/entities/DataTree/types";
import {
  type ENTITY_TYPE,
  ENTITY_TYPE_VALUE,
} from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export function isDynamicEntity(
  entity: DataTreeEntity | DataTreeEntityConfig,
): entity is CE_DynamicEntityType | ModuleInputsEntity {
  return (
    ([ENTITY_TYPE_VALUE.MODULE_INPUT] as Array<ENTITY_TYPE>).includes(
      entity.ENTITY_TYPE,
    ) || CE_isDynamicEntity(entity)
  );
}
