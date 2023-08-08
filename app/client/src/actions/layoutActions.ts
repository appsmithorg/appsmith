/* eslint-disable no-console */
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { LayoutConfigurations } from "utils/autoLayout/autoLayoutTypes";

export const addLayoutConfig = (layoutConfig: LayoutConfigurations) => {
  console.log("####", { layoutConfig });
  return {
    type: ReduxActionTypes.ADD_LAYOUT_CONFIG,
    payload: layoutConfig,
  };
};
