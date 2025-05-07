import type { DefaultRootState } from "react-redux";

export const getIsTokenValid = (state: DefaultRootState) =>
  state.ui.auth.isTokenValid;
export const getIsValidatingToken = (state: DefaultRootState) =>
  state.ui.auth.isValidatingToken;
