import { AppState, DataTree } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";

export const getDataTree = (state: AppState): DataTree => state.entities;

export const getDynamicNames = (state: AppState): DataTree["nameBindings"] =>
  state.entities.nameBindings;

export const getPluginIdOfName = (
  state: AppState,
  name: string,
): string | undefined => {
  const plugin = state.entities.plugins.list.find(
    plugin => plugin.name === name,
  );
  if (!plugin) return undefined;
  return plugin.id;
};

export const getActions = (state: AppState): ActionDataState["data"] =>
  state.entities.actions.data;
