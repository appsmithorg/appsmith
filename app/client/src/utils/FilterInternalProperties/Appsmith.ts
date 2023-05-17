import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type {
  AppsmithEntity,
  DataTree,
} from "entities/DataTree/dataTreeFactory";
import { createObjectPeekData } from "./Common";

export const getAppsmithPeekData = (dataTree: DataTree) => {
  const defs: any = entityDefinitions.APPSMITH(
    dataTree.appsmith as AppsmithEntity,
    {},
  );
  return createObjectPeekData(defs, dataTree.appsmith, {}, "appsmith");
};
