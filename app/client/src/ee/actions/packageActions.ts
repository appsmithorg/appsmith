import type { Package } from "@appsmith/constants/PackageConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface CreatePackageFromWorkspacePayload {
  workspaceId: string;
}

export interface FetchPackagePayload {
  packageId: string;
}

export interface DeletePackagePayload {
  id: string;
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

export const updatePackageName = (value: string, pkg: Package | null) => {
  return {
    type: ReduxActionTypes.UPDATE_PACKAGE_NAME_INIT,
    payload: {
      ...pkg,
      color: pkg?.color || "",
      icon: pkg?.icon || "",
      id: pkg?.id || "",
      modifiedAt: pkg?.modifiedAt || "",
      modifiedBy: pkg?.modifiedBy || "",
      name: value,
      workspaceId: pkg?.workspaceId || "",
      userPermissions: pkg?.userPermissions || [],
    },
  };
};

export const deletePackage = (payload: DeletePackagePayload) => {
  return {
    type: ReduxActionTypes.DELETE_PACKAGE_INIT,
    payload,
  };
};
