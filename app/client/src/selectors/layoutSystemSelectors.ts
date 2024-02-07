import type { AppState } from "@appsmith/reducers";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * selector to fetch the application's layout type
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getLayoutSystemType = (state: AppState) => {
  return LayoutSystemTypes.ANVIL;
};
