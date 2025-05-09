import type { JSActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";

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

      if (
        jsAction.data?.[jsChild.id] &&
        jsChild.runBehaviour === ActionRunBehaviour.ON_PAGE_LOAD
      ) {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (peekData[jsChild.name] as any).data = jsAction.data[jsChild.id];
      }
    });

    const variables = jsAction.config.variables || [];

    variables.forEach((jsChild) => {
      if (dataTreeAction) peekData[jsChild.name] = dataTreeAction[jsChild.name];
    });

    return { peekData };
  }
};
