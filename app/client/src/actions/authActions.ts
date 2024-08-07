import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";

export const getCurrentUser = (userProfile?: ApiResponse) => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
  payload: { userProfile },
});
