import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const segmentInitSuccess = () => ({
  type: ReduxActionTypes.SEGMENT_INITIALIZED,
});

export const segmentInitUncertain = () => ({
  type: ReduxActionTypes.SEGMENT_INIT_UNCERTAIN,
});
