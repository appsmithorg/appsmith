import { createImmerReducer } from "utils/ReducerUtils";
import { defaultLibraries, TJSLibrary } from "utils/DynamicBindingUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import recommendedLibraries from "pages/Editor/Explorer/Libraries/recommendedLibraries";

export enum InstallState {
  Queued,
  Installing,
  Failed,
  Success,
}

export type LibraryState = {
  installationStatus: Record<string, InstallState>;
  installedLibraries: TJSLibrary[];
};

const initialState = {
  installationStatus: {},
  installedLibraries: defaultLibraries.map((lib: TJSLibrary) => {
    return {
      name: lib.name,
      docsURL: lib.docsURL,
      version: lib.version,
      accessor: lib.accessor,
    };
  }),
};

const jsLibraryReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INSTALL_LIBRARY_INIT]: (
    state: LibraryState,
    action: ReduxAction<string>,
  ) => {
    state.installationStatus[action.payload] =
      state.installationStatus[action.payload] || InstallState.Queued;
  },
  [ReduxActionTypes.INSTALL_LIBRARY_START]: (
    state: LibraryState,
    action: ReduxAction<string>,
  ) => {
    state.installationStatus[action.payload] = InstallState.Queued;
  },
  [ReduxActionTypes.INSTALL_LIBRARY_SUCCESS]: (
    state: LibraryState,
    action: ReduxAction<{
      libraryAccessor: string;
      url: string;
      version: string;
    }>,
  ) => {
    const { libraryAccessor, url, version } = action.payload;
    const recommendedLibrary = recommendedLibraries.find(
      (lib) => lib.url === url,
    );
    state.installationStatus[url] = InstallState.Success;
    state.installedLibraries.unshift({
      name: recommendedLibrary?.name || libraryAccessor,
      docsURL: recommendedLibrary?.url || url,
      version: recommendedLibrary?.version || version,
      url,
      accessor: libraryAccessor,
    });
  },
  [ReduxActionTypes.INSTALL_LIBRARY_FAILED]: (
    state: LibraryState,
    action: ReduxAction<string>,
  ) => {
    state.installationStatus[action.payload] = InstallState.Failed;
  },
  [ReduxActionTypes.CLEAR_PROCESSED_INSTALLS]: (state: LibraryState) => {
    for (const key in state.installationStatus) {
      if (
        [InstallState.Success, InstallState.Failed].includes(
          state.installationStatus[key],
        )
      ) {
        delete state.installationStatus[key];
      }
    }
  },
});

export default jsLibraryReducer;
