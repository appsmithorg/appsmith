import { createReducer } from "utils/ReducerUtils";
import { extraLibraries, ExtraLibrary } from "utils/DynamicBindingUtils";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export enum InstallState {
  Installing,
  Queued,
  Failed,
  Success,
}

export type LibraryState = {
  installationStatus: Record<string, InstallState>;
  installedLibraries: Array<{ displayName: string; docsURL: string }>;
};

const initialState = {
  installationStatus: {},
  installedLibraries: extraLibraries.map((lib: ExtraLibrary) => {
    return {
      displayName: lib.displayName,
      docsURL: lib.docsURL,
    };
  }),
};

const jsLibraryReducer = createReducer(initialState, {
  [ReduxActionTypes.INSTALL_LIBRARY_INIT]: (state, action) => {
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [action.payload]: state.installationStatus[action.payload]
          ? state.installationStatus[action.payload]
          : InstallState.Queued,
      },
    };
  },
  [ReduxActionTypes.INSTALL_LIBRARY_START]: (state, action) => {
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [action.payload]: InstallState.Installing,
      },
    };
  },
  [ReduxActionTypes.INSTALL_LIBRARY_SUCCESS]: (state, action) => {
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [action.payload]: InstallState.Success,
      },
    };
  },
  [ReduxActionTypes.INSTALL_LIBRARY_FAILED]: (state, action) => {
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [action.payload]: InstallState.Failed,
      },
    };
  },
});

export default jsLibraryReducer;
