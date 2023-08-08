/* eslint-disable no-console */
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import type { LayoutConfigurations } from "utils/autoLayout/autoLayoutTypes";

const initialState: LayoutConfigurations = {};

const layoutConfigReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.ADD_LAYOUT_CONFIG]: (
    state: LayoutConfigurations,
    action: ReduxAction<LayoutConfigurations>,
  ) => {
    console.log("####", { action });
    return { ...state, ...action.payload };
  },
});

export default layoutConfigReducer;
