import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export type LoadingEntitiesState = Set<string>;

const initialState: LoadingEntitiesState = new Set<string>();

const loadingEntitiesReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_LOADING_ENTITIES]: (
    state: LoadingEntitiesState,
    action: ReduxAction<Set<string>>,
  ): LoadingEntitiesState => action.payload,
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default loadingEntitiesReducer;
