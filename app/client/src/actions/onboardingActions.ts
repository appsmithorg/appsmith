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
