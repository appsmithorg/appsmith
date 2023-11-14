import type { AppState } from "@appsmith/reducers";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * selector to fetch the application's layout type
 */
export const getLayoutSystemType = (state: AppState) => {
  if (1 === 1) {
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
