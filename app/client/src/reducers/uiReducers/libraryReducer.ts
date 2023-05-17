import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import recommendedLibraries from "pages/Editor/Explorer/Libraries/recommendedLibraries";
import type { TJSLibrary } from "workers/common/JSLibrary";
import { defaultLibraries } from "workers/common/JSLibrary";

export enum InstallState {
  Queued,
  Installing,
  Failed,
  Success,
}

export type LibraryState = {
  installationStatus: Record<string, InstallState>;
  installedLibraries: TJSLibrary[];
  isInstallerOpen: boolean;
};

const initialState = {
  isInstallerOpen: false,
  installationStatus: {},
  installedLibraries: defaultLibraries.map((lib: TJSLibrary) => {
    return {
      name: lib.name,
      docsURL: lib.docsURL,
      version: lib.version,
      accessor: lib.accessor,
    };
  }),
  reservedNames: [],
};

const jsLibraryReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.INSTALL_LIBRARY_INIT]: (
    state: LibraryState,
    action: ReduxAction<Partial<TJSLibrary>>,
  ) => {
    const { url } = action.payload;
    state.installationStatus[url as string] =
      state.installationStatus[url as string] || InstallState.Queued;
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
      accessor: string[];
      url: string;
      version: string;
    }>,
  ) => {
    const { accessor, url, version } = action.payload;
    const name = accessor[accessor.length - 1] as string;
    const recommendedLibrary = recommendedLibraries.find(
      (lib) => lib.url === url,
    );
    state.installationStatus[url] = InstallState.Success;
    state.installedLibraries.unshift({
      name: recommendedLibrary?.name || name,
      docsURL: recommendedLibrary?.url || url,
      version: recommendedLibrary?.version || version,
      url,
      accessor,
    });
  },
  [ReduxActionErrorTypes.INSTALL_LIBRARY_FAILED]: (
    state: LibraryState,
    action: ReduxAction<{ url: string }>,
  ) => {
    state.installationStatus[action.payload.url] = InstallState.Failed;
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
  [ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS]: (
    state: LibraryState,
    action: ReduxAction<TJSLibrary[]>,
  ) => {
    state.installedLibraries = action.payload.concat(
      initialState.installedLibraries,
    );
  },
  [ReduxActionTypes.UNINSTALL_LIBRARY_SUCCESS]: (
    state: LibraryState,
    action: ReduxAction<TJSLibrary>,
  ) => {
    const uLib = action.payload;
    state.installedLibraries = state.installedLibraries.filter(
      (lib) => uLib.url !== lib.url,
    );
  },
  [ReduxActionTypes.TOGGLE_INSTALLER]: (
    state: LibraryState,
    action: ReduxAction<boolean>,
  ) => {
    state.isInstallerOpen = action.payload;
  },
});

export default jsLibraryReducer;
