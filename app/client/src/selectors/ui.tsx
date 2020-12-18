import { AppState } from "reducers";

export const getShouldResetSelectedWidget = (state: AppState): boolean =>
  state.ui.widgetDragResize.shouldResetSelectedWidget;
