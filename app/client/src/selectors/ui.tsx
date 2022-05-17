import { AppState } from "reducers";

export const getSelectedWidget = (state: AppState) =>
  state.ui.widgetDragResize.lastSelectedWidget;

export const getSelectedWidgets = (state: AppState) =>
  state.ui.widgetDragResize.selectedWidgets;

/**
 * Selector to use id and provide the status of saving an API.
 */
export const getIsSavingForApiName = (state: AppState, id: string) =>
  state.ui.apiName.isSaving[id];

/**
 * Selector to use id and provide the status of error in an API.
 */
export const getErrorForApiName = (state: AppState, id: string) =>
  state.ui.apiName.errors[id];

/**
 * Selector to use id and provide the status of saving a JS Object.
 */
export const getIsSavingForJSObjectName = (state: AppState, id: string) =>
  state.ui.jsObjectName.isSaving[id];

/**
 * Selector to use id and provide the status of error in a JS Object.
 */
export const getErrorForJSObjectName = (state: AppState, id: string) =>
  state.ui.jsObjectName.errors[id];
