import { AppState } from "reducers";

export const getIsOnboardingHelperVisible = (state: AppState) => {
  const urlSearchParams = new URL(window.location.href).searchParams;
  const isCommentModeInUrl = urlSearchParams.get("isCommentMode");
  return state.ui.onBoarding.showHelper && !isCommentModeInUrl;
};
