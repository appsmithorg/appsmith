import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: ConsolidatedPageLoadState = {
  isLoading: true,
};

const consolidatedPageLoadReducer = createReducer(initialState, {
  [ReduxActionTypes.START_CONSOLIDATED_PAGE_LOAD]: () => ({
    isLoading: true,
  }),
  [ReduxActionTypes.END_CONSOLIDATED_PAGE_LOAD]: () => ({
    isLoading: false,
  }),
});

export interface ConsolidatedPageLoadState {
  isLoading: boolean;
}

export default consolidatedPageLoadReducer;
