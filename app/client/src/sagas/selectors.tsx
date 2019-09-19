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
