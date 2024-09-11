import type {
  ActionEntity,
  DataTreeEntityConfig,
  JSActionEntity,
  WidgetEntity,
} from "ee/entities/DataTree/types";
import {
  type EntityTypeValue,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export type DynamicEntityType = JSActionEntity | WidgetEntity | ActionEntity;

export function isDynamicEntity(
  entity: DataTreeEntity | DataTreeEntityConfig,
): entity is DynamicEntityType {
  return (
    [
      ENTITY_TYPE.JSACTION,
      ENTITY_TYPE.WIDGET,
      ENTITY_TYPE.ACTION,
    ] as Array<EntityTypeValue>
  ).includes(entity.ENTITY_TYPE);
}
