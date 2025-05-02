import type { PackageMetadata } from "ee/constants/PackageConstants";
import type { DefaultRootState } from "react-redux";

const DEFAULT_PACKAGE_LIST: PackageMetadata[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsFetchingPackages = (state: DefaultRootState) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsCreatingPackage = () => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPackagesList = (state: DefaultRootState): PackageMetadata[] =>
  DEFAULT_PACKAGE_LIST;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPackagesOfWorkspace = (state: DefaultRootState) => [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsPackageUpgrading = (state: DefaultRootState): boolean =>
  false;
