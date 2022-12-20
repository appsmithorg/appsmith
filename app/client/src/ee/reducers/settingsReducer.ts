export * from "ce/reducers/settingsReducer";
import {
  handlers as CE_handlers,
  initialState,
  SettingsReduxState,
} from "ce/reducers/settingsReducer";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_SAML_METADATA]: (state: SettingsReduxState) => ({
    ...state,
    isSaving: true,
  }),
  [ReduxActionErrorTypes.FETCH_SAML_METADATA_ERROR]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionTypes.FETCH_SAML_METADATA_SUCCESS]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isSaving: false,
  }),
};

export default createReducer(initialState, handlers);
