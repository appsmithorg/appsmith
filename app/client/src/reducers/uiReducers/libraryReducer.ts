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
  installedLibraries: {
    displayName: string;
    docsURL: string;
    version?: string;
  }[];
};

const initialState = {
  installationStatus: {},
  installedLibraries: extraLibraries.map((lib: ExtraLibrary) => {
    return {
      displayName: lib.displayName,
      docsURL: lib.docsURL,
      version: lib.version,
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
      installedLibraries: [
        ...state.installedLibraries,
        {
          displayName: action.payload,
          docsURL: action.payload,
          version: "",
        },
      ],
    };
  },
  [ReduxActionTypes.INSTALL_LIBRARY_FAILED]: (state, action) => {
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [action.payload]: InstallState.Success,
      },
    };
  },
});

export default jsLibraryReducer;
