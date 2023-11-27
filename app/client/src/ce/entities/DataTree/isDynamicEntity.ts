import type {
  ActionEntity,
  DataTreeEntityConfig,
  JSActionEntity,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import {
  type ENTITY_TYPE,
  ENTITY_TYPE_VALUE,
} from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export type DynamicEntityType = JSActionEntity | WidgetEntity | ActionEntity;

export function isDynamicEntity(
  entity: DataTreeEntity | DataTreeEntityConfig,
): entity is DynamicEntityType {
  return (
    [
      ENTITY_TYPE_VALUE.JSACTION,
      ENTITY_TYPE_VALUE.WIDGET,
      ENTITY_TYPE_VALUE.ACTION,
    ] as Array<ENTITY_TYPE>
  ).includes(entity.ENTITY_TYPE);
}
