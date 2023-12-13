import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";

export const getLastSelectedWidget = (state: AppState) =>
  state.ui.widgetDragResize.lastSelectedWidget;

export const getSelectedWidgets = (state: AppState) =>
  state.ui.widgetDragResize.selectedWidgets;

export const getDefaultWidgetSelection = (state: AppState) => {
  const widgetIds = Object.keys(state.entities.canvasWidgets);
  // Since main container is always in widgets, we want to check if there is
  // another widget that is not the main container
  if (widgetIds.length > 1) {
    return [widgetIds[1]];
  }
  return [];
};

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

export const getFocusedWidget = (state: AppState) =>
  state.ui.widgetDragResize.focusedWidget;

export const isDatasourceInViewMode = (state: AppState) =>
  state.ui.datasourcePane.viewMode;

export const getDsViewModeValues = (state: AppState) => ({
  datasourceId: state.ui.datasourcePane.expandDatasourceId,
  viewMode: state.ui.datasourcePane.viewMode,
});

export const getAllDatasourceCollapsibleState = (state: AppState) =>
  state.ui.datasourcePane.collapsibleState;

export const getDatasourceCollapsibleState = createSelector(
  [getAllDatasourceCollapsibleState, (_state: AppState, key: string) => key],
  (
    datasourceCollapsibleState: { [key: string]: boolean },
    key: string,
  ): boolean | undefined => {
    return datasourceCollapsibleState[key];
  },
);

export const getIsImportingCurl = (state: AppState) =>
  state.ui.imports.isImportingCurl;
