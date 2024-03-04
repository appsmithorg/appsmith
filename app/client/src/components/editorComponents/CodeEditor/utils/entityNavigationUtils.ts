import type { EntityNavigationData } from "utils/NavigationSelector/types";

export const addThisReference = (
  navigationData: EntityNavigationData,
  entityName?: string,
) => {
  if (entityName && entityName in navigationData) {
    return {
      ...navigationData,
      this: navigationData[entityName],
    };
  }
  return navigationData;
};
