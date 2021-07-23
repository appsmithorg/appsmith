import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: JSCollectionNameReduxState = {
  isSaving: {},
  errors: {},
};

const jsCollectionNameReducer = createReducer(initialState, {
  [ReduxActionErrorTypes.SAVE_JS_COLLECTION_NAME_ERROR]: (
    state: JSCollectionNameReduxState,
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
    state: JSCollectionNameReduxState,
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
    state: JSCollectionNameReduxState,
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

export interface JSCollectionNameReduxState {
  isSaving: Record<string, boolean>;
  errors: Record<string, boolean>;
}

export default jsCollectionNameReducer;
