import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";

const getFloatingPaneState = (state: AppState) => state.ui.floatingPane;

export const isFloatingPaneVisible = (state: AppState) =>
  state.ui.floatingPane.isVisible;

export const getFloatingPaneSelectedWidget = createSelector(
  getFloatingPaneState,
  getCanvasWidgets,
  (state, widgets) => {
    if (!state.selectedWidgetId) return widgets["0"];
    return widgets[state.selectedWidgetId];
  },
);
