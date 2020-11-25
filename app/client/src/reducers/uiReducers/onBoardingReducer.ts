import { ReduxAction } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";

const initialState: OnboardingState = {
  currentStep: -1,
  showWelcomeScreen: false,
  creatingDatabase: false,
  inOnboarding: false,
};

export interface OnboardingState {
  currentStep: number;
  showWelcomeScreen: boolean;
  creatingDatabase: boolean;
  inOnboarding: boolean;
}

const onboardingReducer = createReducer(initialState, {
  SHOW_WELCOME: (state: OnboardingState) => {
    return { ...state, showWelcomeScreen: true };
  },
  CREATE_ONBOARDING_DBQUERY_INIT: (state: OnboardingState) => {
    return { ...state, creatingDatabase: true };
  },
  CREATE_ONBOARDING_DBQUERY_SUCCESS: (state: OnboardingState) => {
    return { ...state, creatingDatabase: false, showWelcomeScreen: false };
  },
  CREATE_ONBOARDING_DBQUERY_ERROR: (state: OnboardingState) => {
    return { ...state, creatingDatabase: false };
  },
  INCREMENT_STEP: (state: OnboardingState) => {
    return { ...state, currentStep: state.currentStep + 1 };
  },
  SET_CURRENT_STEP: (state: OnboardingState, action: ReduxAction<number>) => {
    return { ...state, currentStep: action.payload };
  },
  SET_ONBOARDING_STATE: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    if (!action.payload) {
      return {
        ...state,
        inOnboarding: action.payload,
        currentStep: -1,
        showWelcomeScreen: false,
        creatingDatabase: false,
      };
    }

    return {
      ...state,
      inOnboarding: action.payload,
    };
  },
});

export default onboardingReducer;
