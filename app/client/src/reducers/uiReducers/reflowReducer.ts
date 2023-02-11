import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { ReflowedSpaceMap } from "reflow/reflowTypes";

const initialState: widgetReflow = {
  isReflowing: false,
  reflowingWidgets: {},
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReflowReduxActionTypes.STOP_REFLOW]: () => {
    return {
      isReflowing: false,
    };
  },
  [ReflowReduxActionTypes.REFLOW_MOVE]: (
    state: widgetReflow,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
    };
  },
});

export type widgetReflow = {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
};
