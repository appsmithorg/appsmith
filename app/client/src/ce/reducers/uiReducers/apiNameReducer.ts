import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";

export const initialState: ApiNameReduxState = {
  isSaving: {},
  errors: {},
};

export const handlers = {
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
};

const apiNameReducer = createReducer(initialState, handlers);

export interface ApiNameReduxState {
  isSaving: Record<string, boolean>;
  errors: Record<string, boolean>;
}

export default apiNameReducer;
