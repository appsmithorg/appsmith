import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetBindingAcceleratorType } from "reducers/uiReducers/widgetBindingAcceleratorsReducer";

export const setWidgetBindingAccelerator = (
  widgetId: string,
  propertyName: string,
  accelerator: WidgetBindingAcceleratorType,
) => ({
  type: ReduxActionTypes.SET_WIDGET_BINDING_ACCELERATORS,
  payload: { widgetId, propertyName, accelerator },
});

export const resetWidgetBindingAccelerator = (
  widgetId: string,
  propertyName: string,
) => ({
  type: ReduxActionTypes.RESET_WIDGET_BINDING_ACCELERATORS,
  payload: { widgetId, propertyName },
});
