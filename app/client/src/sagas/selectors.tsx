import { AppState } from "../reducers";
import { FlattenedWidgetProps } from "../reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "../widgets/BaseWidget";

export const getWidgets = (
  state: AppState,
): { [widgetId: string]: FlattenedWidgetProps } => {
  return state.entities.canvasWidgets;
};

export const getWidget = (state: AppState, widgetId: string): WidgetProps => {
  return state.entities.canvasWidgets[widgetId];
};

export const getEditorConfigs = (
  state: AppState,
): { pageId: string; layoutId: string } => {
  const { currentLayoutId, currentPageId } = state.ui.editor;
  return {
    pageId: currentPageId,
    layoutId: currentLayoutId,
  };
};
