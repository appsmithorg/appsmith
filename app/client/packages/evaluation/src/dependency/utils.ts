import type { EntityConfig } from "./ee/types";
import { EntityDependencyGetterMap } from "./ee/utils";

export * from "./ee/utils";

export const getEntityDependencies = (
  entity: {
    ENTITY_TYPE: string;
    widgetName?: string;
  },
  entityConfig: EntityConfig,
  allKeys: Record<string, true>,
) => {
  if (!EntityDependencyGetterMap[entity.ENTITY_TYPE]) {
    return {};
  }

  return (
    EntityDependencyGetterMap[entity.ENTITY_TYPE](
      entity,
      entityConfig,
      allKeys,
    ) || {}
  );
};

export const getSetterFunctions = (configTree: {
  [entityName: string]: {
    __setters?: Record<
      string,
      {
        path: string;
        type: string;
      }
    >;
  };
}) => {
  const entityNames = Object.keys(configTree);

  const setters = entityNames.reduce(
    (acc, entityName) => {
      const entityConfig = configTree[entityName];

      if (!entityConfig) return acc;

      if (entityConfig.__setters) {
        for (const setterMethodName of Object.keys(entityConfig.__setters)) {
          acc[`${entityName}.${setterMethodName}`] = true;
        }
      }

      return acc;
    },
    {} as Record<string, true>,
  );

  return setters;
};
