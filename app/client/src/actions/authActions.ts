import type { ApiResponse } from "api/ApiResponses";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const getCurrentUser = (userProfile?: ApiResponse) => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
  payload: { userProfile },
});
