import { entityDefinitions } from "ce/utils/autocomplete/EntityDefinitions";
import {
  DataTreeAppsmith,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { createNavData, createObjectNavData } from "./common";

export const getAppsmithNavData = (dataTree: DataTreeAppsmith) => {
  const defs: any = entityDefinitions.APPSMITH(dataTree, {});

  const result = createObjectNavData(
    defs,
    dataTree,
    "appsmith",
    {},
    {
      // restricting peek after appsmith.store because it can contain user data
      // which if large will slow down nav data generation
      "appsmith.store": true,
    },
  );

  return createNavData(
    "appsmith",
    "appsmith",
    ENTITY_TYPE.APPSMITH,
    false,
    undefined,
    true,
    result.peekData,
    result.entityNavigationData,
  );
};
