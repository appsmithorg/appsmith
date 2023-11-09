export * from "ce/plugins/Linting/lib/entity/isDynamicEntity";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import type { ModuleInputsEntity } from "./ModuleInputsEntity";
import {
  isDynamicEntity as CE_isDynamicEntity,
  type DynamicEntityType,
} from "ce/plugins/Linting/lib/entity/isDynamicEntity";

export function isDynamicEntity(
  entity: IEntity,
): entity is DynamicEntityType | ModuleInputsEntity {
  return (
    [ENTITY_TYPE.MODULE_INPUT].includes(entity.getType()) ||
    CE_isDynamicEntity(entity)
  );
}
