import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const forceOpenWidgetPanel = (flag: boolean) => ({
  type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
  payload: flag,
});
