import { entityDefinitions } from "ce/utils/autocomplete/EntityDefinitions";
import {
  DataTree,
  DataTreeAction,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { EntityNavigationData } from "selectors/navigationSelectors";
import { createNavData } from "./common";

export const getActionChildrenNavData = (
  action: ActionData,
  dataTree: DataTree,
) => {
  const dataTreeAction = dataTree[action.config.name] as DataTreeAction;
  if (dataTreeAction) {
    const definitions = entityDefinitions.ACTION(dataTreeAction, {});
    const peekData: Record<string, unknown> = {};
    const childNavData: EntityNavigationData = {};
    Object.keys(definitions).forEach((key) => {
      if (key.indexOf("!") === -1) {
        if (key === "data" || key === "isLoading" || key === "responseMeta") {
          peekData[key] = dataTreeAction[key];
          childNavData[key] = createNavData(
            `${action.config.name}.${key}`,
            `${action.config.name}.${key}`,
            ENTITY_TYPE.ACTION,
            false,
            undefined,
            true,
            undefined,
            {},
          );
        } else if (key === "run" || key === "clear") {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          peekData[key] = function() {}; // tern inference required here
          childNavData[key] = createNavData(
            `${action.config.name}.${key}`,
            `${action.config.name}.${key}`,
            ENTITY_TYPE.ACTION,
            false,
            undefined,
            true,
            undefined,
            {},
          );
        }
      }
    });

    return { peekData, childNavData };
  }
};
