import type { AppState } from "@appsmith/reducers";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * selector to fetch the application's layout type
 */
export const getLayoutSystemType = (state: AppState) => {
  return LayoutSystemTypes.ANVIL;
};
