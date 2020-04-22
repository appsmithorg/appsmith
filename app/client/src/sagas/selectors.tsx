import { AppState } from "reducers";
import { createSelector } from "reselect";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import _ from "lodash";
import { WidgetType } from "constants/WidgetConstants";

export const getWidgets = (
  state: AppState,
): { [widgetId: string]: FlattenedWidgetProps } => {
  return state.entities.canvasWidgets;
};

export const getWidgetsMeta = (state: AppState) => state.entities.meta;

export const getWidget = (state: AppState, widgetId: string): WidgetProps => {
  return state.entities.canvasWidgets[widgetId];
};

export const getWidgetIdsByType = (state: AppState, type: WidgetType) => {
  return Object.values(state.entities.canvasWidgets)
    .filter((widget: FlattenedWidgetProps) => widget.type === type)
    .map((widget: FlattenedWidgetProps) => widget.widgetId);
};

export const getEditorConfigs = (
  state: AppState,
): { pageId: string; layoutId: string } | undefined => {
  const pageId = state.entities.pageList.currentPageId;
  const layoutId = state.ui.editor.currentLayoutId;
  if (!pageId || !layoutId) return undefined;
  return { pageId, layoutId };
};

export const getDefaultWidgetConfig = (
  state: AppState,
  type: WidgetType,
): Partial<WidgetProps> => {
  const configs = state.entities.widgetConfig.config;
  if (configs.hasOwnProperty(type)) {
    const widgetConfig = { ...configs[type] };
    return widgetConfig;
  }
  return {};
};

export const getWidgetNamePrefix = (
  state: AppState,
  type: WidgetType,
): string => {
  return state.entities.widgetConfig.config[type].widgetName;
};

export const getDefaultPageId = (state: AppState, pageId?: string): string => {
  const { pages } = state.entities.pageList;
  const page = pages.find(page => page.pageId === pageId);
  return page ? page.pageId : pages[0].pageId;
};

export const getExistingWidgetNames = createSelector(
  getWidgets,
  (widgets: { [widgetId: string]: FlattenedWidgetProps }) => {
    return Object.values(widgets).map(widget => widget.widgetName);
  },
);

export const getWidgetByName = (
  state: AppState,
  widgetName: string,
): FlattenedWidgetProps | undefined => {
  const widgets = state.entities.canvasWidgets;
  return _.find(
    Object.values(widgets),
    widget => widget.widgetName === widgetName,
  );
};

export const getPluginIdOfPackageName = (
  state: AppState,
  name: string,
): string | undefined => {
  const plugins = state.entities.plugins.list;
  const plugin = _.find(plugins, { packageName: name });
  if (plugin) return plugin.id;
  return undefined;
};
