import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

const initialState: MultiPaneReduxState = {
  tabsPaneWidth: 400,
  paneCount: 3,
};

const multiPaneReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_TABS_PANE_WIDTH]: (
    state: MultiPaneReduxState,
    action: ReduxAction<{ width: number }>,
  ) => {
    state.tabsPaneWidth = action.payload.width;
  },
  [ReduxActionTypes.SET_PANE_COUNT]: (
    state: MultiPaneReduxState,
    action: ReduxAction<{ count: 2 | 3 }>,
  ) => {
    state.paneCount = action.payload.count;
  },
});

export interface MultiPaneReduxState {
  tabsPaneWidth: number;
  paneCount: 2 | 3;
}

export default multiPaneReducer;
