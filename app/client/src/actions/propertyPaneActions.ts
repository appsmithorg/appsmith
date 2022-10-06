import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const updateWidgetName = (widgetId: string, newName: string) => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
    payload: {
      id: widgetId,
      newName,
    },
  };
};

export const bindDataToWidget = (payload: { widgetId: string }) => {
  return {
    type: ReduxActionTypes.BIND_DATA_TO_WIDGET,
    payload,
  };
};

export const setSnipingMode = (payload: {
  isActive: boolean;
  bindTo?: string;
}) => ({
  type: ReduxActionTypes.SET_SNIPING_MODE,
  payload,
});

export const resetSnipingMode = () => ({
  type: ReduxActionTypes.RESET_SNIPING_MODE,
});

export const setPropertySectionState = (key: string, isOpen: boolean) => {
  return {
    type: ReduxActionTypes.SET_PROPERTY_SECTION_STATE,
    payload: { key, isOpen },
  };
};
export const setAllPropertySectionState = (payload: {
  [key: string]: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_ALL_PROPERTY_SECTION_STATE,
    payload,
  };
};
export const setSelectedPropertyTabIndex = (selectedIndex: number) => {
  return {
    type: ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
    payload: selectedIndex,
  };
};
