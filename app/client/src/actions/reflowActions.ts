import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { widgetReflowOnBoardingState } from "reducers/uiReducers/reflowReducer";
import { ReflowedSpaceMap } from "reflow/reflowTypes";

export const reflowMoveAction = (
  payload: ReflowedSpaceMap,
): ReduxAction<ReflowedSpaceMap> => {
  return {
    type: ReflowReduxActionTypes.REFLOW_MOVE,
    payload: payload,
  };
};

export const stopReflowAction = () => {
  return {
    type: ReflowReduxActionTypes.STOP_REFLOW,
  };
};

export const setEnableReflowAction = (payload: boolean) => {
  return {
    type: ReflowReduxActionTypes.ENABLE_REFLOW,
    payload,
  };
};

export const updateReflowOnBoardingAction = (
  payload: widgetReflowOnBoardingState,
) => {
  return {
    type: ReflowReduxActionTypes.ONBOARDING_UPDATE,
    payload,
  };
};

export const forceStopOnBoardingAction = () => {
  return {
    type: ReflowReduxActionTypes.FORCE_STOP_ON_BOARDING,
  };
};
