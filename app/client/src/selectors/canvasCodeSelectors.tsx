import type { AppState } from "@appsmith/reducers";

export const isCanvasCodeActive = (state: AppState) =>
  state.ui.users.featureFlag.data.CANVAS_CODE === true;
