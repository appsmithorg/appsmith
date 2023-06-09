import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const saveSettings = (settings: any, needsRestart = true) => ({
  type: ReduxActionTypes.SAVE_ADMIN_SETTINGS,
  payload: {
    settings,
    needsRestart,
  },
});

export const retryServerRestart = () => ({
  type: ReduxActionTypes.RETRY_RESTART_SERVER_POLL,
});
