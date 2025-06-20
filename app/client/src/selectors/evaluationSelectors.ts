import type { DefaultRootState } from "react-redux";

export const getRenderPage = (state: DefaultRootState): boolean =>
  state.evaluations?.firstEvaluation?.renderPage ?? false;

export const getIsFirstPageLoad = (state: DefaultRootState): boolean =>
  state.evaluations?.firstEvaluation?.isFirstPageLoad ?? false;
