import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReflowReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReflowedSpaceMap } from "reflow/reflowTypes";

const initialState: widgetReflow = {
  isReflowing: false,
  reflowingWidgets: {},
};

export const widgetReflowReducer = createImmerReducer(initialState, {
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
