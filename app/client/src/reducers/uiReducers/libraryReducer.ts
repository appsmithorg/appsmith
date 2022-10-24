import { createReducer } from "utils/ReducerUtils";
import { extraLibraries, ExtraLibrary } from "utils/DynamicBindingUtils";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

const initialState = {
  installationQueue: {},
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
      installationQueue: {
        ...state.installationQueue,
        [action.payload]: "QUEUED",
      },
    };
  },
});

export default jsLibraryReducer;
