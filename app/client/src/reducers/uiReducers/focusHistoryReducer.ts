import { createReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { FocusEntity } from "navigation/FocusableEntity";
import { FocusableElement, FocusableInput } from "navigation/FocusableElement";

type FocusState = {
  entity: FocusEntity;
  entityId: string;
  element: FocusableElement | FocusableInput;
  timeAdded: Date;
};

type focusHistoryState = Record<string, FocusState>;

const initialState: { focusInfo: focusHistoryState } = {
  focusInfo: {},
};

/**
 * 1. Keep adding new focus events
 * 2. Maintain a max focus list (future)
 * 3. Quick search for focus state of a entity
 * */

const focusHistoryReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_FOCUS_HISTORY]: (state, focusState: FocusState) => {
    if (Object.keys(state).length > 5) {
      // remove the oldest one
    }
    // add new
  },
  [ReduxActionTypes.FOCUS_HISTORY_SUCCESS]: () => ({}),
});

export default focusHistoryReducer;
