import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

import {
  TemplateList,
  CollectionDataArray,
} from "constants/collectionsConstants";

const initialState: ImportedCollectionsReduxState = {
  isFetchingImportedCollections: false,
  importedCollections: [],
};

const importedCollectionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_IMPORTED_COLLECTIONS_INIT]: (
    state: ImportedCollectionsReduxState,
  ) => ({ ...state, isFetchingImportedCollections: true }),
  [ReduxActionTypes.FETCH_IMPORTED_COLLECTIONS_SUCCESS]: (
    state: ImportedCollectionsReduxState,
    action: ReduxAction<Array<CollectionDataArray>>,
  ) => ({
    ...state,
    importedCollections: action.payload[0].apiTemplateList,
    isFetchingImportedCollections: false,
  }),
  [ReduxActionErrorTypes.FETCH_IMPORTED_COLLECTIONS_ERROR]: (
    state: ImportedCollectionsReduxState,
  ) => {
    return { ...state, isFetchingImportedCollections: false };
  },
});

export interface ImportedCollectionsReduxState {
  isFetchingImportedCollections: boolean;
  importedCollections: TemplateList[];
}

export default importedCollectionsReducer;
