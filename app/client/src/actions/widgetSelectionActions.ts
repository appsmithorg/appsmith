import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { SelectionRequestType } from "sagas/WidgetSelectUtils";
import type { NavigationMethod } from "utils/history";

export type WidgetSelectionRequestPayload = {
  selectionRequestType: SelectionRequestType;
  payload?: string[];
  invokedBy?: NavigationMethod;
  pageId?: string;
};

export type WidgetSelectionRequest = (
  selectionRequestType: SelectionRequestType,
  payload?: string[],
  invokedBy?: NavigationMethod,
  pageId?: string,
) => ReduxAction<WidgetSelectionRequestPayload>;

// Use to select a widget programmatically via platform action
export const selectWidgetInitAction: WidgetSelectionRequest = (
  selectionRequestType,
  payload,
  invokedBy?: NavigationMethod,
  pageId?: string,
) => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { selectionRequestType, payload, pageId, invokedBy },
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
