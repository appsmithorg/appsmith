import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ReflowedSpaceMap } from "reflow/reflowTypes";

const initialState: widgetReflowState = {
  isReflowing: false,
  reflowingWidgets: {},
  enableReflow: true,
  cardShown: true,
  accThreshold: 20,
  speedThreshold: 20,
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({
    accThreshold,
    cardShown,
    enableReflow,
    speedThreshold,
  }: widgetReflowState) => {
    return {
      isReflowing: false,
      enableReflow,
      cardShown,
      accThreshold,
      speedThreshold,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    {
      accThreshold,
      cardShown,
      enableReflow,
      speedThreshold,
    }: widgetReflowState,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      enableReflow,
      cardShown,
      accThreshold,
      speedThreshold,
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
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, cardShown: action.payload };
  },
  [ReflowReduxActionTypes.ACC_THRESHOLD_CHANGE]: (
    state: widgetReflowState,
    action: ReduxAction<number>,
  ) => {
    return {
      ...state,
      accThreshold: action.payload,
    };
  },
  [ReflowReduxActionTypes.SPEED_THRESHOLD_CHANGE]: (
    state: widgetReflowState,
    action: ReduxAction<number>,
  ) => {
    return {
      ...state,
      speedThreshold: action.payload,
    };
  },
});

export type widgetReflow = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
  cardShown: boolean;
  accThreshold: number;
  speedThreshold: number;
};

export type widgetReflowState = widgetReflow & {
  enableReflow: boolean;
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
