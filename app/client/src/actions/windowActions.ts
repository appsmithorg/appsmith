import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const updateWindowDimensions = (height: number, width: number) => ({
  type: ReduxActionTypes.UPDATE_WINDOW_DIMENSIONS,
  payload: { height, width },
});
