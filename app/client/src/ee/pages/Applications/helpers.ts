export * from "ce/pages/Applications/helpers";

import { useSelector } from "react-redux";

import { getIsFetchingPackages } from "@appsmith/selectors/packageSelectors";

/**
 * This hook returns the functions and flags for packages.
 *
 * @returns
 */
export const usePackage = () => {
  const isFetchingPackages = useSelector(getIsFetchingPackages);

  return {
    isFetchingPackages,
  };
};
