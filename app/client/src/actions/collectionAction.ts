import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const fetchImportedCollections = () => {
  return {
    type: ReduxActionTypes.FETCH_IMPORTED_COLLECTIONS_INIT,
  };
};
