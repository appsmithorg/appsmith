import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const saveSettings = (settings: Record<string, string>) => ({
  type: ReduxActionTypes.SAVE_ADMIN_SETTINGS,
  payload: settings,
});

export const retryServerRestart = () => ({
  type: ReduxActionTypes.RETRY_RESTART_SERVER_POLL,
});
