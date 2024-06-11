import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const segmentInitSuccess = () => ({
  type: ReduxActionTypes.SEGMENT_INITIALIZED,
});

export const segmentInitUncertain = () => ({
  type: ReduxActionTypes.SEGMENT_INIT_UNCERTAIN,
});

export const recordAnalyticsForSideBySideWidgetHover = (
  widgetType: string,
) => ({
  type: ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_WIDGET_HOVER,
  payload: widgetType,
});

export const sendAnalyticsForSideBySideHover = () => ({
  type: ReduxActionTypes.SEND_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER,
});

export const recordAnalyticsForSideBySideNavigation = () => ({
  type: ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_NAVIGATION,
});

export const resetAnalyticsForSideBySideHover = () => ({
  type: ReduxActionTypes.RESET_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER,
});
