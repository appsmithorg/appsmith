import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ReflowedSpaceMap } from "reflow/reflowTypes";

const initialState: widgetReflow = {
  isReflowing: false,
  reflowingWidgets: {},
  shouldResize: false,
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({ shouldResize }: widgetReflow) => {
    return {
      isReflowing: false,
      shouldResize,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    { shouldResize }: widgetReflow,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      shouldResize,
    };
  },
  [ReflowReduxActionTypes.RESIZE_RESIZING]: (
    state: widgetReflow,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, shouldResize: action.payload };
  },
});

export type widgetReflowState = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
};

export type widgetReflow = widgetReflowState & {
  shouldResize: boolean;
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
