import { AppState } from "@appsmith/reducers";

export const getTenantPermissions = (state: AppState) => {
  return state.tenant?.userPermissions;
};
