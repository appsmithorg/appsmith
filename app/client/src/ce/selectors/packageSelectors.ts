import type { PackageMetadata } from "ee/constants/PackageConstants";
import type { AppState } from "ee/reducers";

const DEFAULT_PACKAGE_LIST: PackageMetadata[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsFetchingPackages = (state: AppState) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsCreatingPackage = (state: AppState, workspaceId: string) =>
  false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPackagesList = (state: AppState): PackageMetadata[] =>
  DEFAULT_PACKAGE_LIST;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPackagesOfWorkspace = (state: AppState) => [];
