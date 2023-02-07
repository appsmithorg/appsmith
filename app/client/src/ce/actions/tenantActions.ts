import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const getCurrentTenant = (isBackgroundRequest = true) => ({
  type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
  payload: {
    isBackgroundRequest,
  },
});
