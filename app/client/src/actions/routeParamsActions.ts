import { RoutesParamsReducerState } from "reducers/uiReducers/routesParamsReducer";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const updateRouteParams = (payload: RoutesParamsReducerState) => ({
  type: ReduxActionTypes.UPDATE_ROUTES_PARAMS,
  payload,
});
