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

export interface PublishPackagePayload {
  packageId: string;
}

export interface FetchConsumablePackagesInWorkspacePayload {
  workspaceId: string;
}

export interface ImportPackagePayload {
  packageId?: string;
  workspaceId: string;
  file?: File;
}

export const fetchAllPackages = () => {
  return {
    type: ReduxActionTypes.FETCH_ALL_PACKAGES_INIT,
  };
};

export const fetchConsumablePackagesInWorkspace = (
  payload: FetchConsumablePackagesInWorkspacePayload,
) => {
  return {
    type: ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_INIT,
    payload,
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

export const updatePackage = (
  payload: Partial<Package> & Pick<Package, "id">,
) => {
  return {
    type: ReduxActionTypes.UPDATE_PACKAGE_INIT,
    payload,
  };
};

export const deletePackage = (payload: DeletePackagePayload) => {
  return {
    type: ReduxActionTypes.DELETE_PACKAGE_INIT,
    payload,
  };
};

export const publishPackage = (payload: PublishPackagePayload) => {
  return {
    type: ReduxActionTypes.PUBLISH_PACKAGE_INIT,
    payload,
  };
};

export const importPackage = (payload: ImportPackagePayload) => {
  return {
    type: ReduxActionTypes.IMPORT_PACKAGE_INIT,
    payload,
  };
};
