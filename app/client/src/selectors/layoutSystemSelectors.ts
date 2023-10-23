import type { AppState } from "@appsmith/reducers";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * selector to fetch the application's layout type
 */
export const getLayoutSystemType = (state: AppState) => {
  const featureFlag = state.ui.users.featureFlag.data;
  if (featureFlag && featureFlag.release_anvil_enabled === true) {
    return LayoutSystemTypes.ANVIL;
  }
  if (
    state.ui.applications?.currentApplication?.applicationDetail?.appPositioning
      ?.type
  ) {
    return LayoutSystemTypes[
      state.ui.applications.currentApplication?.applicationDetail
        ?.appPositioning?.type
    ];
  }
  return LayoutSystemTypes.FIXED;
};
