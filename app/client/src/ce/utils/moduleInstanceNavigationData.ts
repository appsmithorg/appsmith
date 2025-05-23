import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";
import type { EntityNavigationData } from "entities/DataTree/dataTreeTypes";

export const getModuleInstanceNavigationData = (
  /* eslint-disable @typescript-eslint/no-unused-vars */
  moduleInstances: Record<string, ModuleInstance>,
  /* eslint-disable @typescript-eslint/no-unused-vars */
  moduleInstanceEntities: unknown,
): EntityNavigationData => {
  return {};
};
