import type { AppState } from "@appsmith/reducers";

export const getDatasourceResponsePaneHeight = (state: AppState) =>
  state.ui.datasourcePane.responseTabHeight;
