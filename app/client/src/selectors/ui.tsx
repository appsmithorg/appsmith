import { AppState } from "reducers";

export const getSelectedWidget = (state: AppState) =>
  state.ui.widgetDragResize.selectedWidget;
