import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const segmentInitSuccess = () => ({
  type: ReduxActionTypes.SEGMENT_INITIALIZED,
});
export const segmentInitUncertain = () => ({
  type: ReduxActionTypes.SEGMENT_INIT_UNCERTAIN,
});
