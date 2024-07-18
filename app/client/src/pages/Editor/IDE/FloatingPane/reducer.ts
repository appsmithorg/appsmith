import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface FloatingPaneState {
  isVisible: boolean;
  selectedWidgetId?: string;
  referenceElement?: HTMLElement | null;
}

const initialState: FloatingPaneState = {
  selectedWidgetId: "0",
  isVisible: false,
};

const reducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_FLOATING_PANE]: (
    state: FloatingPaneState,
    action: ReduxAction<FloatingPaneState>,
  ) => ({
    ...state,
    ...action.payload,
  }),
});

export default reducer;
