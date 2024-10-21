import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";

const getFloatingPaneState = (state: AppState) => state.ui.floatingPane;

export const isFloatingPaneVisible = (state: AppState) =>
  state.ui.floatingPane.selectedWidgetId !== "0";

export const getFloatingPaneSelectedWidget = createSelector(
  getFloatingPaneState,
  getCanvasWidgets,
  (state, widgets) => {
    if (!state.selectedWidgetId) return widgets["0"];
    return widgets[state.selectedWidgetId];
  },
);

export const getFloatingPaneInitProperty = (state: AppState) =>
  state.ui.floatingPane.propertyName;

export const getFloatingPaneRefElement = (state: AppState) =>
  state.ui.floatingPane.referenceElement;

export const getFloatingPaneSelectedWidgetId = (state: AppState) =>
  state.ui.floatingPane.selectedWidgetId;

export const isPropertyPaneActiveForWidget = (
  state: AppState,
  widgetId: string,
) =>
  createSelector(
    [isFloatingPaneVisible, getFloatingPaneSelectedWidgetId],
    (isVisible, selectedWidgetId) => isVisible && selectedWidgetId === widgetId,
  )(state);
