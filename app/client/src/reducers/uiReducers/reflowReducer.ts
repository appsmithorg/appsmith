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
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({
    cardShown,
    enableReflow,
  }: widgetReflowState) => {
    return {
      isReflowing: false,
      enableReflow,
      cardShown,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    { cardShown, enableReflow }: widgetReflowState,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      enableReflow,
      cardShown,
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
});

export type widgetReflow = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
  cardShown: boolean;
};

export type widgetReflowState = widgetReflow & {
  enableReflow: boolean;
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
