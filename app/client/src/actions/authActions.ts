import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";

export const getCurrentUser = (v1UsersMeResp?: ApiResponse) => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
  payload: { v1UsersMeResp },
});
