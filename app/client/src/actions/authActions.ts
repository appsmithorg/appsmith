import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const getCurrentUser = () => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
});
