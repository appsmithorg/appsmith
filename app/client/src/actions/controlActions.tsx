import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { RenderMode } from "constants/WidgetConstants";

export const updateWidgetProperty = (
  widgetId: string,
  propertyName: string,
  propertyValue: any,
  renderMode: RenderMode,
): ReduxAction<UpdateWidgetPropertyPayload> => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
      renderMode,
    },
  };
};

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
  renderMode: RenderMode;
  dynamicBindings?: Record<string, boolean>;
  dynamicTriggers?: Record<string, true>;
}
