import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";

const initialState: RoutesParamsReducerState = {
  applicationId: "",
  pageId: "",
};

const routesParamsReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_ROUTES_PARAMS]: (
    state: RoutesParamsReducerState,
    action: ReduxAction<RoutesParamsReducerState>,
  ) => {
    return { ...action.payload };
  },
});

export interface RoutesParamsReducerState {
  applicationId: string;
  pageId: string;
}

export default routesParamsReducer;
