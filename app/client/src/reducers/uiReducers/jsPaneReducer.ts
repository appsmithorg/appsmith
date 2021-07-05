import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { JSAction } from "entities/JSAction";
export interface JsPaneReduxState {
  isCreating: boolean; // RR
  isFetching: boolean; // RR
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>; // RN
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  extraformData: Record<string, any>;
}

const initialState: JsPaneReduxState = {
  isCreating: false,
  isFetching: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  isDirty: {},
  extraformData: {},
};

const jsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.CREATE_JS_ACTION_INIT]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: true,
  }),
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSAction }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
    isDirty: {
      ...state.isDirty,
      [action.payload.data.id]: false,
    },
  }),
});

export default jsPaneReducer;
