import { OnboardingStep } from "constants/OnboardingConstants";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";

const initialState: OnboardingState = {
  currentStep: OnboardingStep.NONE,
  showWelcomeScreen: false,
  creatingDatabase: false,
  showCompletionDialog: false,
  inOnboarding: false,
  createdDBQuery: false,
  addedWidget: false,
  showingTooltip: OnboardingStep.NONE,
  showingIndicator: OnboardingStep.NONE,
};

export interface OnboardingState {
  currentStep: OnboardingStep;
  showWelcomeScreen: boolean;
  creatingDatabase: boolean;
  showCompletionDialog: boolean;
  inOnboarding: boolean;
  createdDBQuery: boolean;
  addedWidget: boolean;
  // Tooltip is shown when the step matches this value
  showingTooltip: OnboardingStep;
  showingIndicator: OnboardingStep;
}

const onboardingReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_WELCOME]: (state: OnboardingState) => {
    return { ...state, showWelcomeScreen: true };
  },
  [ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_INIT]: (
    state: OnboardingState,
  ) => {
    return { ...state, creatingDatabase: true };
  },
  [ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_SUCCESS]: (
    state: OnboardingState,
  ) => {
    return {
      ...state,
      creatingDatabase: false,
      showWelcomeScreen: false,
      createdDBQuery: true,
    };
  },
  [ReduxActionErrorTypes.CREATE_ONBOARDING_DBQUERY_ERROR]: (
    state: OnboardingState,
  ) => {
    return { ...state, creatingDatabase: false };
  },
  [ReduxActionTypes.INCREMENT_STEP]: (state: OnboardingState) => {
    return { ...state, currentStep: state.currentStep + 1 };
  },
  [ReduxActionTypes.SET_CURRENT_STEP]: (
    state: OnboardingState,
    action: ReduxAction<number>,
  ) => {
    return { ...state, currentStep: action.payload };
  },
  [ReduxActionTypes.SET_ONBOARDING_STATE]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...initialState,
      inOnboarding: action.payload,
    };
  },
  [ReduxActionTypes.ADD_WIDGET_COMPLETE]: (state: OnboardingState) => {
    return {
      ...state,
      addedWidget: true,
    };
  },
  [ReduxActionTypes.SHOW_ONBOARDING_TOOLTIP]: (
    state: OnboardingState,
    action: ReduxAction<OnboardingStep>,
  ) => {
    return {
      ...state,
      showingTooltip: action.payload,
    };
  },
  [ReduxActionTypes.SHOW_ONBOARDING_INDICATOR]: (
    state: OnboardingState,
    action: ReduxAction<OnboardingStep>,
  ) => {
    return {
      ...state,
      showingIndicator: action.payload,
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
