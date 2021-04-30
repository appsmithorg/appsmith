import { AppState } from "reducers";

export const getSelectedWidget = (state: AppState) =>
  state.ui.widgetDragResize.selectedWidget;

export const getSelectedWidgets = (state: AppState) =>
  state.ui.widgetDragResize.selectedWidgets;
