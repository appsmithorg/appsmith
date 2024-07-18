import type { FloatingPaneState } from "./reducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const updateFloatingPane = (payload: FloatingPaneState) => ({
  type: ReduxActionTypes.UPDATE_FLOATING_PANE,
  payload,
});
