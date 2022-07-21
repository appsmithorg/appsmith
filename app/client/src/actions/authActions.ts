import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const getCurrentUser = () => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
});
