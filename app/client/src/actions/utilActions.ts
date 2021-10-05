import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const historyPush = (url: string) => ({
  type: ReduxActionTypes.HISTORY_PUSH,
  payload: {
    url,
  },
});

export const windowRedirect = (url: string) => ({
  type: ReduxActionTypes.REDIRECT_WINDOW_LOCATION,
  payload: {
    url,
  },
});
