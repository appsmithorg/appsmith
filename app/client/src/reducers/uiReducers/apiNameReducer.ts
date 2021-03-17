import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: ApiNameReduxState = {
  isSaving: {},
  errors: {},
};

const apiNameReducer = createReducer(initialState, {
  [ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR]: (
    state: ApiNameReduxState,
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

  [ReduxActionTypes.SAVE_ACTION_NAME_INIT]: (
    state: ApiNameReduxState,
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
  [ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS]: (
    state: ApiNameReduxState,
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

export interface ApiNameReduxState {
  isSaving: Record<string, boolean>;
  errors: Record<string, boolean>;
}

export default apiNameReducer;
