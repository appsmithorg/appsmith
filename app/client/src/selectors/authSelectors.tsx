import { AppState } from "reducers";

export const getIsTokenValid = (state: AppState) => state.ui.auth.isTokenValid;
export const getIsValidatingToken = (state: AppState) =>
  state.ui.auth.isValidatingToken;
