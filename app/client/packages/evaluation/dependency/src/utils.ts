import type { EntityConfig } from "./ee/types";
import { EntityDependencyGetterMap } from "./ee/utils";

export {
  getDependencyFromEntityPath,
  addWidgetPropertyDependencies,
} from "./ee/utils";

export const getEntityDependencies = (
  entity: {
    ENTITY_TYPE: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    widgetName?: string;
  },
  entityConfig: EntityConfig,
  allKeys: Record<string, true>,
) => {
  if (!EntityDependencyGetterMap[entity.ENTITY_TYPE]) {
    return {};
  }

  return EntityDependencyGetterMap[entity.ENTITY_TYPE](
    entity,
    entityConfig,
    allKeys,
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

  const setters = entityNames.reduce((acc, entityName) => {
    const entityConfig = configTree[entityName];
    const entityMethodMap: Record<string, true> = {};

    if (!entityConfig) return acc;

    if (entityConfig.__setters) {
      for (const setterMethodName of Object.keys(entityConfig.__setters)) {
        entityMethodMap[`${entityName}.${setterMethodName}`] = true;
      }
    }

    return { ...acc, ...entityMethodMap };
  }, {});

  return setters;
};
