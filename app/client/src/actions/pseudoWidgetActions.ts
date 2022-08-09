import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";

export const addPseudoWidget = (
  parentWidgetId: string,
  widgetProps: WidgetProps | WidgetProps[],
) => ({
  type: ReduxActionTypes.ADD_PSEUDO_WIDGET,
  payload: {
    parentWidgetId,
    widgetProps,
  },
});

export const updatePseudoWidget = (payload: WidgetProps | WidgetProps[]) => ({
  type: ReduxActionTypes.UPDATE_PSEUDO_WIDGET,
  payload: {
    payload,
  },
});

export const deletePseudoWidget = (payload: string | string[]) => ({
  type: ReduxActionTypes.DELETE_PSEUDO_WIDGET,
  payload: {
    payload,
  },
});
