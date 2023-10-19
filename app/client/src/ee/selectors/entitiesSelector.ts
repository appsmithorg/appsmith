export * from "ce/selectors/entitiesSelector";

import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import {
  getActions,
  getJSCollections,
  getCurrentPageId,
} from "ce/selectors/entitiesSelector";

import type { ModuleInput } from "@appsmith/entities/DataTree/types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCurrentModuleId = (state: AppState) => ""; //state.ui.editor.currentModuleId;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCurrentPackageId = (state: AppState) => ""; //state.ui.editor.currentPackageId;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getModules = (state: AppState) => []; //state.entities.modules

export const getInputsForModule = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: AppState,
): Record<string, ModuleInput> => {
  //return state.entities.modules[getCurrentModuleId].inputs;
  return {};
};

export const getCurrentActions = createSelector(
  getCurrentPageId,
  getCurrentModuleId,
  getActions,
  (pageId, moduleId, actions) => {
    if (!!moduleId.length) return actions;
    if (!pageId) return [];
    return actions.filter((a) => a.config.pageId === pageId);
  },
);

export const getCurrentJSCollections = createSelector(
  getCurrentPageId,
  getCurrentModuleId,
  getJSCollections,
  (pageId, moduleId, actions) => {
    if (!!moduleId) return actions;
    if (!pageId) return [];
    return actions.filter((a) => a.config.pageId === pageId);
  },
);
