import { useCallback } from "react";

import { getIsFetchingPackages } from "ee/selectors/packageSelectors";
import { useSelector } from "react-redux";

export const usePackage = () => {
  const isFetchingPackages = useSelector(getIsFetchingPackages);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  const createPackage = useCallback((workspaceId: string) => {}, []);

  return {
    isFetchingPackages,
    createPackage,
  };
};
