import type { AppState } from "@appsmith/reducers";
import type { IDEAppState } from "./ideReducer";

export const getIdeAppState = (state: AppState): IDEAppState =>
  state.ui.ide.state;
