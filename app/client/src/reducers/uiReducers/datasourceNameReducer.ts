import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";

const initialState: DatasourceNameReduxState = {
  isSaving: {},
  errors: {},
};

const datasourceNameReducer = createReducer(initialState, {
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

import type { DatasourceNameReduxState } from "./datasourceNameReducer.types";

export default datasourceNameReducer;
