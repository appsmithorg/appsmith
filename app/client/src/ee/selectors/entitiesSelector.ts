export * from "ce/selectors/entitiesSelector";

import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import {
  getActions,
  getJSCollections,
  getCurrentPageId,
} from "ce/selectors/entitiesSelector";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { getCurrentModuleId } from "@appsmith/selectors/modulesSelector";

export const getInputsForModule = (state: AppState): Module["inputsForm"] => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];
  return module?.inputsForm || [];
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
