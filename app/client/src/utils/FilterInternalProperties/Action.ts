import { entityDefinitions } from "ee/utils/autocomplete/EntityDefinitions";
import type { ActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";

export const getActionChildrenPeekData = (
  actionName: string,
  dataTree: DataTree,
) => {
  const dataTreeAction = dataTree[actionName] as ActionEntity;

  if (dataTreeAction) {
    const definitions = entityDefinitions.ACTION(dataTreeAction, {});
    const peekData: Record<string, unknown> = {};

    Object.keys(definitions).forEach((key) => {
      if (key.indexOf("!") === -1) {
        if (key === "data" || key === "isLoading" || key === "responseMeta") {
          peekData[key] = dataTreeAction[key];
        } else if (key === "run" || key === "clear") {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          peekData[key] = function () {}; // tern inference required here
        }
      }
    });

    return { peekData };
  }
};
