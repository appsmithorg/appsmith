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
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({
    enableReflow,
    onBoarding,
  }: widgetReflowState) => {
    return {
      isReflowing: false,
      enableReflow,
      onBoarding,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    { enableReflow, onBoarding }: widgetReflowState,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      enableReflow,
      onBoarding,
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
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
