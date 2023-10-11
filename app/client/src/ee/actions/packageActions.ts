import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface CreatePackageFromWorkspacePayload {
  workspaceId: string;
}

export interface FetchPackagePayload {
  packageId: string;
}

export const fetchAllPackages = () => {
  return {
    type: ReduxActionTypes.FETCH_ALL_PACKAGES_INIT,
  };
};

export const fetchPackage = (payload: FetchPackagePayload) => ({
  type: ReduxActionTypes.FETCH_PACKAGE_INIT,
  payload,
});

export const createPackageFromWorkspace = (
  payload: CreatePackageFromWorkspacePayload,
) => {
  return {
    type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
    payload,
  };
};
