import {
  type ReduxAction,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { ReflowedSpaceMap } from "reflow/reflowTypes";

export const reflowMoveAction = (
  payload: ReflowedSpaceMap,
): ReduxAction<ReflowedSpaceMap> => {
  return {
    type: ReduxActionTypes.REFLOW_MOVE,
    payload: payload,
  };
};

export const stopReflowAction = () => {
  return {
    type: ReduxActionTypes.STOP_REFLOW,
  };
};
