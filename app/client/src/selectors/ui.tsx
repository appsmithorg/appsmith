import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";

export const getLastSelectedWidget = (state: DefaultRootState) =>
  state.ui.widgetDragResize.lastSelectedWidget;

export const getSelectedWidgets = (state: DefaultRootState) =>
  state.ui.widgetDragResize.selectedWidgets;

export const getDefaultSelectedWidgetIds = (state: DefaultRootState) => {
  const widgets = Object.keys(state.entities.canvasWidgets);

  // We check for more than 1 because MainContainer is always present
  if (widgets.length > 1) {
    return [widgets[1]];
  }
};

/**
 * Selector to use id and provide the status of saving an API.
 */
export const getIsSavingForApiName = (state: DefaultRootState, id: string) =>
  state.ui.apiName.isSaving[id];

/** Select saving status for all API names */
export const getApiNameSavingStatuses = (state: DefaultRootState) =>
  state.ui.apiName.isSaving;

/**
 * Selector to use id and provide the status of error in an API.
 */
export const getErrorForApiName = (state: DefaultRootState, id: string) =>
  state.ui.apiName.errors[id];

/**
 * Selector to use id and provide the status of saving a JS Object.
 */
export const getIsSavingForJSObjectName = (
  state: DefaultRootState,
  id: string,
) => state.ui.jsObjectName.isSaving[id];

/** Select saving status for all JS object names */
export const getJsObjectNameSavingStatuses = (state: DefaultRootState) =>
  state.ui.jsObjectName.isSaving;

/**
 * Selector to use id and provide the status of error in a JS Object.
 */
export const getErrorForJSObjectName = (state: DefaultRootState, id: string) =>
  state.ui.jsObjectName.errors[id];

export const getFocusedWidget = (state: DefaultRootState) =>
  state.ui.widgetDragResize.focusedWidget;

export const isDatasourceInViewMode = (state: DefaultRootState) =>
  state.ui.datasourcePane.viewMode;

export const getDsViewModeValues = (state: DefaultRootState) => ({
  datasourceId: state.ui.datasourcePane.expandDatasourceId,
  viewMode: state.ui.datasourcePane.viewMode,
});

export const getAllDatasourceCollapsibleState = (state: DefaultRootState) =>
  state.ui.datasourcePane.collapsibleState;

export const getDatasourceCollapsibleState = createSelector(
  [
    getAllDatasourceCollapsibleState,
    (_state: DefaultRootState, key: string) => key,
  ],
  (
    datasourceCollapsibleState: { [key: string]: boolean },
    key: string,
  ): boolean | undefined => {
    return datasourceCollapsibleState[key];
  },
);

export const getIsConsolidatedPageLoading = (state: DefaultRootState) =>
  state.ui.consolidatedPageLoad.isLoading;

export const getIsAltFocusWidget = (state: DefaultRootState) =>
  state.ui.widgetDragResize.altFocus;

export const getWidgetSelectionBlock = (state: DefaultRootState) =>
  state.ui.widgetDragResize.blockSelection;

export const getAltBlockWidgetSelection = createSelector(
  [getWidgetSelectionBlock, getIsAltFocusWidget],
  (isWidgetSelectionBlock, isAltFocusWidget) => {
    return isWidgetSelectionBlock ? !isAltFocusWidget : false;
  },
);
