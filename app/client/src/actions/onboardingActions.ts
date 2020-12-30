import { OnboardingStep } from "constants/OnboardingConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const showTooltip = (payload: OnboardingStep) => {
  return {
    type: ReduxActionTypes.SHOW_ONBOARDING_TOOLTIP,
    payload,
  };
};

export const showIndicator = (payload: OnboardingStep) => {
  return {
    type: ReduxActionTypes.SHOW_ONBOARDING_INDICATOR,
    payload,
  };
};

export const endOnboarding = () => {
  return {
    type: ReduxActionTypes.END_ONBOARDING,
  };
};

export const setCurrentStep = (payload: number) => {
  return {
    type: ReduxActionTypes.SET_CURRENT_STEP,
    payload,
  };
};

export const setOnboardingState = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_ONBOARDING_STATE,
    payload,
  };
};
