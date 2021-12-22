import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const saveSettings = (settings: Record<string, string>) => ({
  type: ReduxActionTypes.SAVE_ADMIN_SETTINGS,
  payload: settings,
});
