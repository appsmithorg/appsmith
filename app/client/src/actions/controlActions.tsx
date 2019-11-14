import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import { RenderMode } from "../constants/WidgetConstants";
import { ErrorCode } from "../constants/validationErrorCodes";

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

export const updateWidgetPropertyValidation = (
  widgetId: string,
  propertyName: string,
  errorCode: ErrorCode,
): ReduxAction<UpdateWidgetPropertyValidation> => ({
  type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY_VALIDATION,
  payload: {
    widgetId,
    propertyName,
    errorCode,
  },
});

export interface UpdateWidgetPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
  renderMode: RenderMode;
}

export interface UpdateWidgetPropertyValidation {
  widgetId: string;
  propertyName: string;
  errorCode: ErrorCode;
}
