import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
