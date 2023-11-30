import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { QueryModuleInstanceEntity } from "@appsmith/entities/DataTree/types";

const propertySetterMap: Record<
  string,
  (entityName: string, entity: QueryModuleInstanceEntity) => unknown
> = {
  [MODULE_TYPE.QUERY]: () => {},
  [MODULE_TYPE.JS]: () => {},
  [MODULE_TYPE.UI]: () => {},
};

export function getModuleInstanceForEvalContext(
  entityName: string,
  entity: QueryModuleInstanceEntity,
) {
  const addPropertyToEntity = propertySetterMap[entity.type];
  if (!addPropertyToEntity) return entity;

  // addPropertyToEntity mutates entity to set specific property value
  addPropertyToEntity(entityName, entity);

  return entity;
}
