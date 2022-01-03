import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ReflowedSpaceMap } from "reflow/reflowTypes";

const initialState: widgetReflow = {
  isReflowing: false,
  reflowingWidgets: {},
  enableReflow: true,
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: ({ enableReflow }: widgetReflow) => {
    return {
      isReflowing: false,
      enableReflow,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    { enableReflow }: widgetReflow,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
      enableReflow,
    };
  },
  [ReflowReduxActionTypes.ENABLE_REFLOW]: (
    state: widgetReflow,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, enableReflow: action.payload };
  },
});

export type widgetReflowState = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
};

export type widgetReflow = widgetReflowState & {
  enableReflow: boolean;
};

export type Reflow = {
  reflowingWidgets?: ReflowedSpaceMap;
};
