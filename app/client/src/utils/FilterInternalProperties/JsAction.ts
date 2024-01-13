import type { JSActionEntity } from "@appsmith/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";

export const getJsActionPeekData = (
  jsAction: JSCollectionData,
  dataTree: DataTree,
) => {
  const peekData: Record<string, unknown> = {};

  const dataTreeAction = dataTree[jsAction.config.name] as JSActionEntity;

  if (dataTreeAction) {
    jsAction.config.actions.forEach((jsChild) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      peekData[jsChild.name] = function () {};

      if (jsAction.data?.[jsChild.id] && jsChild.executeOnLoad) {
        (peekData[jsChild.name] as any).data = jsAction.data[jsChild.id];
      }
    });

    jsAction.config.variables.forEach((jsChild) => {
      if (dataTreeAction) peekData[jsChild.name] = dataTreeAction[jsChild.name];
    });

    return { peekData };
  }
};
