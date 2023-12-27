import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { AppsmithEntity } from "@appsmith/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createObjectPeekData } from "./Common";

export const getAppsmithPeekData = (dataTree: DataTree) => {
  const defs: any = entityDefinitions.APPSMITH(
    dataTree.appsmith as AppsmithEntity,
    {},
  );
  return createObjectPeekData(defs, dataTree.appsmith, {}, "appsmith");
};
