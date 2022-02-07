import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: DatasourceNameReduxState = {
  isSaving: {},
  errors: {},
  name: {},
};

const datasourceNameReducer = createReducer(initialState, {
  [ReduxActionTypes.SAVE_DATASOURCE_NAME]: (
    state: DatasourceNameReduxState,
    action: ReduxAction<{ id: string; name: string }>,
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
      name: {
        ...state.name,
        [action.payload.id]: action.payload.name,
      },
    };
  },
  [ReduxActionErrorTypes.UPDATE_DATASOURCE_NAME_ERROR]: (
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

  [ReduxActionTypes.UPDATE_DATASOURCE_NAME]: (
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
  [ReduxActionTypes.UPDATE_DATASOURCE_NAME_SUCCESS]: (
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
  name: Record<string, string>;
}

export default datasourceNameReducer;
