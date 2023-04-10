import { entityDefinitions } from "ce/utils/autocomplete/EntityDefinitions";
import type { AppsmithEntity } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { createNavData, createObjectNavData } from "./common";

export const getAppsmithNavData = (dataTree: AppsmithEntity) => {
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

  return createNavData({
    id: "appsmith",
    name: "appsmith",
    type: ENTITY_TYPE.APPSMITH,
    url: undefined,
    peekable: true,
    peekData: result.peekData,
    children: result.entityNavigationData,
  });
};
