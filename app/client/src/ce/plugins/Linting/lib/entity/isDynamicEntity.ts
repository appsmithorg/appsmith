import type { ActionEntity } from "plugins/Linting/lib/entity/ActionEntity";
import type { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";
import type { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";

// only Widgets, jsActions and Actions have paths that can be dynamic
export function isDynamicEntity(
  entity: IEntity,
): entity is JSEntity | WidgetEntity | ActionEntity {
  return [
    ENTITY_TYPE.JSACTION,
    ENTITY_TYPE.WIDGET,
    ENTITY_TYPE.ACTION,
  ].includes(entity.getType());
}
