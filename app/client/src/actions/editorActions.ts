import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setPreviewMode = (payload: boolean) => ({
  type: ReduxActionTypes.SET_PREVIEW_MODE,
  payload,
});
