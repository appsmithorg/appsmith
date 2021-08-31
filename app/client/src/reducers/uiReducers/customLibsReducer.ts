import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import ExtraLibraryClass, {
  defaultLibraries,
  ExtraLibrary,
} from "utils/ExtraLibrary";

export type CustomLibsReduxState = {
  defaultLibraries: ExtraLibrary[];
  additionalLibraries: ExtraLibrary[];
  currentInstallations: string[];
};

const initialState: CustomLibsReduxState = {
  defaultLibraries: defaultLibraries,
  additionalLibraries: [],
  currentInstallations: [],
};

const customLibsReducer = createReducer(initialState, {
  [ReduxActionTypes.LIB_INSTALL_INIT]: (
    state: CustomLibsReduxState,
    action: ReduxAction<ExtraLibrary>,
  ) => ({
    ...state,
    currentInstallations: [...state.currentInstallations, action.payload.name],
  }),
  [ReduxActionTypes.LIB_INSTALL_SUCCESS]: (
    state: CustomLibsReduxState,
    action: ReduxAction<ExtraLibrary>,
  ) => ({
    ...state,
    additionalLibraries: [...state.additionalLibraries, action.payload],
    currentInstallations: state.currentInstallations.filter(
      (lib: string) => lib !== action.payload.name,
    ),
  }),
  [ReduxActionTypes.LIB_UNINSTALL_SUCCESS]: (
    state: CustomLibsReduxState,
    action: ReduxAction<string>,
  ) => ({
    ...state,
    additionalLibraries: state.additionalLibraries.filter(
      (lib: ExtraLibrary) => lib.accessor !== action.payload,
    ),
  }),
  [ReduxActionErrorTypes.LIB_INSTALL_ERROR]: (
    state: CustomLibsReduxState,
    action: ReduxAction<ExtraLibrary>,
  ) => ({
    ...state,
    currentInstallations: state.currentInstallations.filter(
      (lib: string) => lib !== action.payload.name,
    ),
  }),
});

export default customLibsReducer;
