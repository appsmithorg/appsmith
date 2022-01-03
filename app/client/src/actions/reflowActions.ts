import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ReflowedSpaceMap } from "reflow/reflowTypes";

export const reflowMove = (
  payload: ReflowedSpaceMap,
): ReduxAction<ReflowedSpaceMap> => {
  return {
    type: ReflowReduxActionTypes.REFLOW_MOVE,
    payload: payload,
  };
};

export const stopReflow = () => {
  return {
    type: ReflowReduxActionTypes.STOP_REFLOW,
  };
};

export const setEnableReflow = (payload: boolean) => {
  return {
    type: ReflowReduxActionTypes.ENABLE_REFLOW,
    payload,
  };
};
