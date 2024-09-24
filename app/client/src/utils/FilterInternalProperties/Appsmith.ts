import { entityDefinitions } from "ee/utils/autocomplete/EntityDefinitions";
import type { AppsmithEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { createObjectPeekData } from "./Common";

export const getAppsmithPeekData = (dataTree: DataTree) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defs: any = entityDefinitions.APPSMITH(
    dataTree.appsmith as AppsmithEntity,
    {},
  );

  return createObjectPeekData(defs, dataTree.appsmith, {}, "appsmith");
};
