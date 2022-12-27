import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

const initialState: MultiPaneReduxState = {
  tabsPaneWidth: 400,
};

const multiPaneReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_TABS_PANE_WIDTH]: (
    state: MultiPaneReduxState,
    action: ReduxAction<{ width: number }>,
  ) => {
    state.tabsPaneWidth = action.payload.width;
  },
});

export interface MultiPaneReduxState {
  tabsPaneWidth: number;
}

export default multiPaneReducer;
