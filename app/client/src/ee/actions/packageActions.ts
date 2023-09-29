import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchAllPackages = () => {
  return {
    type: ReduxActionTypes.FETCH_ALL_PACKAGES_INIT,
  };
};
