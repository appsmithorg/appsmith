import type { Package } from "@appsmith/constants/PackageConstants";
import type { AppState } from "@appsmith/reducers";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsFetchingPackages = (state: AppState) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsCreatingPackage = (state: AppState, workspaceId: string) =>
  false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPackagesList = (state: AppState): Package[] => [];
