import { AppState } from "reducers";
export const getTemplatesSelector = (state: AppState) =>
  state.ui.templates.templates;
