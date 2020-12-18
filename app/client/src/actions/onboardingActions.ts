import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Action } from "entities/Action";

export const createOnboardingActionInit = (payload: Partial<Action>) => {
  return {
    type: ReduxActionTypes.CREATE_ONBOARDING_ACTION_INIT,
    payload,
  };
};

export const createOnboardingActionSuccess = (payload: Action) => {
  return {
    type: ReduxActionTypes.CREATE_ONBOARDING_ACTION_SUCCESS,
    payload,
  };
};

export const showTooltip = (payload: number) => {
  return {
    type: ReduxActionTypes.SHOW_ONBOARDING_TOOLTIP,
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
