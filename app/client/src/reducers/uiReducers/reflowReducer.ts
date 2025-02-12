import { createReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";
import type { ReflowedSpaceMap } from "reflow/reflowTypes";

const initialState: widgetReflow = {
  isReflowing: false,
  reflowingWidgets: {},
};

export const widgetReflowReducer = createReducer(initialState, {
  [ReduxActionTypes.STOP_REFLOW]: () => {
    return {
      isReflowing: false,
    };
  },
  [ReduxActionTypes.REFLOW_MOVE]: (
    state: widgetReflow,
    action: ReduxAction<{ reflowingWidgets: ReflowedSpaceMap }>,
  ) => {
    return {
      isReflowing: true,
      reflowingWidgets: { ...action.payload },
    };
  },
});

export interface widgetReflow {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
}
