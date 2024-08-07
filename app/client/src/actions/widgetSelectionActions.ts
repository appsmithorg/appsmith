import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { SelectionRequestType } from "sagas/WidgetSelectUtils";
import type { NavigationMethod } from "utils/history";

export interface WidgetSelectionRequestPayload {
  selectionRequestType: SelectionRequestType;
  payload?: string[];
  invokedBy?: NavigationMethod;
  basePageId?: string;
}

export type WidgetSelectionRequest = (
  selectionRequestType: SelectionRequestType,
  payload?: string[],
  invokedBy?: NavigationMethod,
  basePageId?: string,
) => ReduxAction<WidgetSelectionRequestPayload>;

// Use to select a widget programmatically via platform action
export const selectWidgetInitAction: WidgetSelectionRequest = (
  selectionRequestType,
  payload,
  invokedBy?: NavigationMethod,
  basePageId?: string,
) => ({
  type: ReduxActionTypes.SELECT_WIDGET_INIT,
  payload: { selectionRequestType, payload, basePageId, invokedBy },
});

export interface SetSelectedWidgetsPayload {
  widgetIds: string[];
  invokedBy?: NavigationMethod;
}

// To be used to collect selected widget state from url and set on state
export const setSelectedWidgets = (
  widgetIds: string[],
  invokedBy?: NavigationMethod,
): ReduxAction<SetSelectedWidgetsPayload> => {
  return {
    type: ReduxActionTypes.SET_SELECTED_WIDGETS,
    payload: { widgetIds, invokedBy },
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

export const setEntityExplorerAncestry = (widgetIds: string[]) => {
  return {
    type: ReduxActionTypes.SET_ENTITY_EXPLORER_WIDGET_ANCESTRY,
    payload: widgetIds,
  };
};
