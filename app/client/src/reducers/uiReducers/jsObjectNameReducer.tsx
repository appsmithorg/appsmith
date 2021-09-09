import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: JSObjectNameReduxState = {
  isSaving: {},
  errors: {},
};

const jsObjectNameReducer = createReducer(initialState, {
  [ReduxActionErrorTypes.SAVE_JS_COLLECTION_NAME_ERROR]: (
    state: JSObjectNameReduxState,
    action: ReduxAction<{ actionId: string }>,
  ) => {
    return {
      ...state,
      isSaving: {
        ...state.isSaving,
        [action.payload.actionId]: false,
      },
      errors: {
        ...state.errors,
        [action.payload.actionId]: true,
      },
    };
  },

  [ReduxActionTypes.SAVE_JS_COLLECTION_NAME_INIT]: (
    state: JSObjectNameReduxState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      isSaving: {
        ...state.isSaving,
        [action.payload.id]: true,
      },
      errors: {
        ...state.errors,
        [action.payload.id]: false,
      },
    };
  },
  [ReduxActionTypes.SAVE_JS_COLLECTION_NAME_SUCCESS]: (
    state: JSObjectNameReduxState,
    action: ReduxAction<{ actionId: string }>,
  ) => {
    return {
      ...state,
      isSaving: {
        ...state.isSaving,
        [action.payload.actionId]: false,
      },
      errors: {
        ...state.errors,
        [action.payload.actionId]: false,
      },
    };
  },
});

export interface JSObjectNameReduxState {
  isSaving: Record<string, boolean>;
  errors: Record<string, boolean>;
}

export default jsObjectNameReducer;
