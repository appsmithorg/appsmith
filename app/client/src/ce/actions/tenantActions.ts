import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const getCurrentTenant = () => ({
  type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
});
