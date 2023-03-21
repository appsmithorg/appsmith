import { entityDefinitions } from "ce/utils/autocomplete/EntityDefinitions";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { ActionData } from "reducers/entityReducers/actionsReducer";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import { createNavData } from "./common";
import type { ActionEntity } from "entities/DataTree/types";

export const getActionChildrenNavData = (
  action: ActionData,
  dataTree: DataTree,
) => {
  const dataTreeAction = dataTree[action.config.name] as ActionEntity;
  if (dataTreeAction) {
    const definitions = entityDefinitions.ACTION(dataTreeAction, {});
    const peekData: Record<string, unknown> = {};
    const childNavData: EntityNavigationData = {};
    Object.keys(definitions).forEach((key) => {
      if (key.indexOf("!") === -1) {
        if (key === "data" || key === "isLoading" || key === "responseMeta") {
          peekData[key] = dataTreeAction[key];
          childNavData[key] = createNavData({
            id: `${action.config.name}.${key}`,
            name: `${action.config.name}.${key}`,
            type: ENTITY_TYPE.ACTION,
            url: undefined,
            peekable: true,
            peekData: undefined,
            children: {},
          });
        } else if (key === "run" || key === "clear") {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          peekData[key] = function () {}; // tern inference required here
          childNavData[key] = createNavData({
            id: `${action.config.name}.${key}`,
            name: `${action.config.name}.${key}`,
            type: ENTITY_TYPE.ACTION,
            url: undefined,
            peekable: true,
            peekData: undefined,
            children: {},
          });
        }
      }
    });

    return { peekData, childNavData };
  }
};
