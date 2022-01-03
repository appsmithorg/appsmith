import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { widgetReflowOnBoardingState } from "reducers/uiReducers/reflowReducer";
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

export const updateReflowOnBoarding = (
  payload: widgetReflowOnBoardingState,
) => {
  return {
    type: ReflowReduxActionTypes.ONBOARDING_UPDATE,
    payload,
  };
};
