import type { ActionEntity } from "plugins/Linting/lib/entity/ActionEntity";
import type { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";
import type { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";
import { ENTITY_TYPE, type IEntity } from "ee/plugins/Linting/lib/entity/types";

export type DynamicEntityType = JSEntity | WidgetEntity | ActionEntity;
// only Widgets, jsActions and Actions have paths that can be dynamic
export function isDynamicEntity(entity: IEntity): entity is DynamicEntityType {
  return [
    ENTITY_TYPE.JSACTION,
    ENTITY_TYPE.WIDGET,
    ENTITY_TYPE.ACTION,
  ].includes(entity.getType());
}
