import type { AppState } from "@appsmith/reducers";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { Action } from "entities/Action";
import { createSelector } from "reselect";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";

const DEFAULT_INPUT_EVAL_VALUES = {};

export const getAllModules = (state: AppState) => state.entities.modules;

export const getCurrentModuleId = (state: AppState) =>
  state.ui.editor.currentModuleId || "";

export const getCurrentModule = createSelector(
  getAllModules,
  getCurrentModuleId,
  (modules, moduleId) => modules[moduleId],
);

export const getModulePermissions = (state: AppState) => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];

  return module?.userPermissions || [];
};

export const getModuleById = (
  state: AppState,
  moduleId: string,
): Module | undefined => state.entities.modules[moduleId];

export const getIsModuleFetchingEntities = (state: AppState) =>
  state.ui.editor.isModuleFetchingEntities;

export const getModulePublicAction = (
  state: AppState,
  moduleId: string,
): Action | undefined => {
  const action = state.entities.actions.find(
    (action) => action.config.moduleId === moduleId && action.config.isPublic,
  );

  return action ? action.config : undefined;
};

export const getModulePublicJSCollection = (
  state: AppState,
  moduleId: string,
) => {
  const action = state.entities.jsActions.find(
    (action) => action.config.moduleId === moduleId && action.config.isPublic,
  );

  return action ? action.config : undefined;
};

export const getIsModuleSaving = (state: AppState) => {
  return state.ui.editor.isModuleUpdating;
};

export const getModuleInputsEvalValues = (state: AppState) =>
  state.evaluations.tree?.inputs || DEFAULT_INPUT_EVAL_VALUES;

export const getModuleInstanceActions = (state: AppState) =>
  state.entities.moduleInstanceEntities.actions;

export const getModuleInstanceJSCollections = (
  state: AppState,
): JSCollectionData[] => state.entities.moduleInstanceEntities.jsCollections;
