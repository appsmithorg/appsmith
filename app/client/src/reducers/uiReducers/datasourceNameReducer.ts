import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: DatasourceNameReduxState = {
  isSaving: {},
  errors: {},
};

const datasourceNameReducer = createReducer(initialState, {
  [ReduxActionErrorTypes.SAVE_DATASOURCE_NAME_ERROR]: (
    state: DatasourceNameReduxState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      isSaving: {
        ...state.isSaving,
        [action.payload.id]: false,
      },
      errors: {
        ...state.errors,
        [action.payload.id]: true,
      },
    };
  },

  [ReduxActionTypes.SAVE_DATASOURCE_NAME]: (
    state: DatasourceNameReduxState,
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
  [ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS]: (
    state: DatasourceNameReduxState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      isSaving: {
        ...state.isSaving,
        [action.payload.id]: false,
      },
      errors: {
        ...state.errors,
        [action.payload.id]: false,
      },
    };
  },
});

export interface DatasourceNameReduxState {
  isSaving: Record<string, boolean>;
  errors: Record<string, boolean>;
}

export default datasourceNameReducer;
