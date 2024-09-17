import type { EntityNavigationData } from "selectors/navigationSelectors";

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
