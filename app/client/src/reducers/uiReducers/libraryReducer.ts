import { createReducer } from "utils/ReducerUtils";
import { extraLibraries, ExtraLibrary } from "utils/DynamicBindingUtils";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import recommendedLibraries from "pages/Editor/Explorer/Libraries/recommendedLibraries";

export enum InstallState {
  Queued,
  Installing,
  Failed,
  Success,
}

export type LibraryState = {
  installationStatus: Record<string, InstallState>;
  installedLibraries: {
    displayName: string;
    docsURL: string;
    version?: string;
    accessor: string;
    url?: string;
  }[];
};

const initialState = {
  installationStatus: {},
  installedLibraries: extraLibraries.map((lib: ExtraLibrary) => {
    return {
      displayName: lib.displayName,
      docsURL: lib.docsURL,
      version: lib.version,
      accessor: lib.accessor,
    };
  }),
};

const jsLibraryReducer = createReducer(initialState, {
  [ReduxActionTypes.INSTALL_LIBRARY_INIT]: (state, action) => {
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [action.payload]:
          state.installationStatus[action.payload] || InstallState.Queued,
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
    const { libraryAccessor, url, version } = action.payload;
    const recommendedLibrary = recommendedLibraries.find(
      (lib) => lib.url === url,
    );
    return {
      ...state,
      installationStatus: {
        ...state.installationStatus,
        [url]: InstallState.Success,
      },
      installedLibraries: [
        {
          displayName: recommendedLibrary?.name || libraryAccessor,
          docsURL: recommendedLibrary?.url || url,
          version: recommendedLibrary?.version || version,
          url,
          accessor: libraryAccessor,
        },
        ...state.installedLibraries,
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
  [ReduxActionTypes.CLEAR_PROCESSED_INSTALLS]: (state) => {
    const installationStatus = Object.keys(state.installationStatus).reduce(
      (acc, key) => {
        if (
          [InstallState.Queued, InstallState.Installing].includes(
            state.installationStatus[key],
          )
        )
          acc[key] = state.installationStatus[key];
        return acc;
      },
      {} as any,
    );
    return {
      ...state,
      installationStatus,
    };
  },
});

export default jsLibraryReducer;
