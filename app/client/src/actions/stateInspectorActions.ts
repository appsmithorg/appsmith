import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const openStateInspector = () => ({
  type: ReduxActionTypes.STATE_INSPECTOR_OPEN,
});
export const closeStateInspector = () => ({
  type: ReduxActionTypes.STATE_INSPECTOR_CLOSE,
});
