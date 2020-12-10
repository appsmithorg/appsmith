import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";

const initialState: OnboardingState = {
  currentStep: -1,
  showWelcomeScreen: false,
  creatingDatabase: false,
  showCompletionDialog: false,
  inOnboarding: false,
  createdDBQuery: false,
  addedWidget: false,
  showingTooltip: -1,
};

export interface OnboardingState {
  currentStep: number;
  showWelcomeScreen: boolean;
  creatingDatabase: boolean;
  showCompletionDialog: boolean;
  inOnboarding: boolean;
  createdDBQuery: boolean;
  addedWidget: boolean;
  // Tooltip is shown when the step matches this value
  showingTooltip: number;
}

const onboardingReducer = createReducer(initialState, {
  SHOW_WELCOME: (state: OnboardingState) => {
    return { ...state, showWelcomeScreen: true };
  },
  CREATE_ONBOARDING_DBQUERY_INIT: (state: OnboardingState) => {
    return { ...state, creatingDatabase: true };
  },
  CREATE_ONBOARDING_DBQUERY_SUCCESS: (state: OnboardingState) => {
    return {
      ...state,
      creatingDatabase: false,
      showWelcomeScreen: false,
      createdDBQuery: true,
    };
  },
  CREATE_ONBOARDING_DBQUERY_ERROR: (state: OnboardingState) => {
    return { ...state, creatingDatabase: false };
  },
  INCREMENT_STEP: (state: OnboardingState) => {
    return { ...state, currentStep: state.currentStep + 1 };
  },
  [ReduxActionTypes.SET_CURRENT_STEP]: (
    state: OnboardingState,
    action: ReduxAction<number>,
  ) => {
    return { ...state, currentStep: action.payload };
  },
  SET_ONBOARDING_STATE: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...initialState,
      inOnboarding: action.payload,
    };
  },
  ADD_WIDGET_COMPLETE: (state: OnboardingState) => {
    return {
      ...state,
      addedWidget: true,
    };
  },
  [ReduxActionTypes.SHOW_ONBOARDING_TOOLTIP]: (
    state: OnboardingState,
    action: ReduxAction<number>,
  ) => {
    return {
      ...state,
      showingTooltip: action.payload,
    };
  },
  [ReduxActionTypes.SHOW_ONBOARDING_COMPLETION_DIALOG]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showCompletionDialog: action.payload,
    };
  },
});

export default onboardingReducer;
