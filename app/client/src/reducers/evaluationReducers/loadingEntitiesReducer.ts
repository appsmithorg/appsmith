import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { isEqual } from "lodash";

export type LoadingEntitiesState = Set<string>;

const initialState: LoadingEntitiesState = new Set<string>();

const loadingEntitiesReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_LOADING_ENTITIES]: (
    state: LoadingEntitiesState,
    action: ReduxAction<Set<string>>,
  ): LoadingEntitiesState => {
    const newLoadingEntities = action.payload;

    // its just a set with string properties time complexity of equal is not too bad
    if (isEqual(state, newLoadingEntities)) {
      return state;
    }

    return newLoadingEntities;
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default loadingEntitiesReducer;
