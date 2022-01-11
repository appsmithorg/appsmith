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
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({
    enableReflow,
  }: widgetReflowState) => {
    return {
      isReflowing: false,
      enableReflow,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    { enableReflow }: widgetReflowState,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      enableReflow,
    };
  },
  [ReflowReduxActionTypes.ENABLE_REFLOW]: (
    state: widgetReflowState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, enableReflow: action.payload };
  },
});

export type widgetReflow = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
};

export type widgetReflowState = widgetReflow & {
  enableReflow: boolean;
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
