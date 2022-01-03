import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ReflowedSpaceMap } from "reflow/reflowTypes";
import { ReflowBetaScreenSteps } from "reflow/betascreens/ReflowBetaScreenSteps";

const initialState: widgetReflowState = {
  isReflowing: false,
  reflowingWidgets: {},
  enableReflow: true,
  onBoarding: {
    done: true,
    finishedStep: ReflowBetaScreenSteps.length,
  },
  forceStopOnBoarding: false,
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({
    enableReflow,
    forceStopOnBoarding,
    onBoarding,
  }: widgetReflowState) => {
    return {
      isReflowing: false,
      enableReflow,
      onBoarding,
      forceStopOnBoarding,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    { enableReflow, forceStopOnBoarding, onBoarding }: widgetReflowState,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      enableReflow,
      onBoarding,
      forceStopOnBoarding,
    };
  },
  [ReflowReduxActionTypes.ENABLE_REFLOW]: (
    state: widgetReflowState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, enableReflow: action.payload };
  },
  [ReflowReduxActionTypes.ONBOARDING_UPDATE]: (
    state: widgetReflowState,
    action: ReduxAction<widgetReflowOnBoardingState>,
  ) => {
    return { ...state, onBoarding: action.payload };
  },
  [ReflowReduxActionTypes.FORCE_STOP_ON_BOARDING]: (
    state: widgetReflowState,
  ) => {
    return { ...state, forceStopOnBoarding: true };
  },
});

export type widgetReflow = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
};

export type widgetReflowOnBoardingState = {
  done: boolean;
  finishedStep: number;
};

export type widgetReflowState = widgetReflow & {
  enableReflow: boolean;
  onBoarding: widgetReflowOnBoardingState;
  forceStopOnBoarding: boolean;
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
