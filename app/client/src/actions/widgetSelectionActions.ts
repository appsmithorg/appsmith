import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

export type WidgetSelectionRequestPayload = {
  selectionRequestType: SelectionRequestType;
  payload?: string[];
};

export type WidgetSelectionRequest = (
  selectionRequestType: SelectionRequestType,
  payload?: string[],
) => ReduxAction<WidgetSelectionRequestPayload>;

// Use to select a widget programmatically via platform action
export const selectWidgetInitAction: WidgetSelectionRequest = (
  selectionRequestType,
  payload,
) => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { selectionRequestType, payload },
});

// To be used to collect selected widget state from url and set on state
export const setSelectedWidgets = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_WIDGETS,
    payload: { widgetIds },
  };
};

export const setLastSelectedWidget = (widgetId: string) => {
  return {
    type: ReduxActionTypes.SET_LAST_SELECTED_WIDGET,
    payload: { lastSelectedWidget: widgetId },
  };
};

export const setSelectedWidgetAncestry = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTRY,
    payload: widgetIds,
  };
};

export const appendSelectedWidgetToUrl = (selectedWidgets: string[]) => {
  return {
    type: ReduxActionTypes.APPEND_SELECTED_WIDGET_TO_URL,
    payload: { selectedWidgets },
  };
};
