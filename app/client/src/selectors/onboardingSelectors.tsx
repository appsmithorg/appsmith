import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getCurrentApplicationId } from "./editorSelectors";

export const getIsOnboardingHelperVisible = (state: AppState) => {
  const urlSearchParams = new URL(window.location.href).searchParams;
  const isCommentModeInUrl = urlSearchParams.get("isCommentMode");
  return state.ui.onBoarding.showHelper && !isCommentModeInUrl;
};

export const getEnableFirstTimeUserExperience = (state: AppState) => {
  return state.ui.onBoarding.enableFirstTimeUserExperience;
};

export const getFirstTimeUserExperienceApplicationId = (state: AppState) => {
  return state.ui.onBoarding.firstTimeUserExperienceApplicationId;
};

export const getFirstTimeUserExperienceComplete = (state: AppState) => {
  return state.ui.onBoarding.firstTimeUserExperienceComplete;
};

export const getFirstTimeUserExperienceModal = (state: AppState) =>
  state.ui.onBoarding.showFirstTimeUserExperienceModal;

export const getIsFirstTimeUserExperienceEnabled = createSelector(
  getCurrentApplicationId,
  getEnableFirstTimeUserExperience,
  getFirstTimeUserExperienceApplicationId,
  (currentApplicationId, enabled, applicationId) => {
    return enabled && currentApplicationId === applicationId;
  },
);
