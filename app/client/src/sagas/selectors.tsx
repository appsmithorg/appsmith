import { AppState } from "../reducers";
import { FlattenedWidgetProps } from "../reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "../widgets/BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
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

export const getDefaultWidgetConfig = (
  state: AppState,
  type: WidgetType,
): Partial<WidgetProps> => {
  const configs = state.entities.widgetConfig.config;
  const widgetConfig = { ...configs[type] };
  delete widgetConfig.rows;
  delete widgetConfig.columns;
  return widgetConfig;
};

export const getPageLayoutId = (state: AppState, pageId: string): string => {
  const pages = state.ui.appView.pages;
  const page = pages.find(page => page.pageId === pageId);
  if (!page) {
    throw Error("Page not found");
  }
  return page.layoutId;
};
