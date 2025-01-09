import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import type { ActiveField } from "./activeFieldEditorReducer.types";

const initialState: ActiveField = null;

const activeFieldReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_ACTIVE_EDITOR_FIELD]: (
    state: ActiveField,
    action: ReduxAction<{ field: string }>,
  ) => {
    return action.payload.field;
  },
  [ReduxActionTypes.RESET_ACTIVE_EDITOR_FIELD]: () => {
    return initialState;
  },
});

export default activeFieldReducer;
