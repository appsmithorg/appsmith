import {
  OnboardingHelperConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";

const initialState: OnboardingState = {
  currentStep: OnboardingStep.NONE,
  currentSubstep: 0,
  showOnboardingLoader: false,
  showWelcomeHelper: false,
  creatingDatabase: false,
  inOnboarding: false,
  createdDBQuery: false,
  addedWidget: false,
  showHelper: false,
  showingIndicator: OnboardingStep.NONE,
  helperStepConfig: {
    title: "",
    action: {
      label: "",
    },
    allowMinimize: false,
  },
  inOnboardingWidgetSelection: false,
  enableFirstTimeUserExperience: false,
  firstTimeUserExperienceApplicationId: "",
  firstTimeUserExperienceComplete: false,
  showFirstTimeUserExperienceModal: false,
};

export interface OnboardingState {
  currentStep: OnboardingStep;
  currentSubstep: number;
  showOnboardingLoader: boolean;
  showWelcomeHelper: boolean;
  creatingDatabase: boolean;
  inOnboarding: boolean;
  createdDBQuery: boolean;
  addedWidget: boolean;
  showHelper: boolean;
  helperStepConfig: OnboardingHelperConfig;
  showingIndicator: OnboardingStep;
  inOnboardingWidgetSelection: boolean;
  enableFirstTimeUserExperience: boolean;
  firstTimeUserExperienceApplicationId: string;
  firstTimeUserExperienceComplete: boolean;
  showFirstTimeUserExperienceModal: boolean;
}

const onboardingReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_ONBOARDING_LOADER]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, showOnboardingLoader: action.payload };
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
    return { ...state, currentStep: action.payload, currentSubstep: 0 };
  },
  [ReduxActionTypes.SET_ONBOARDING_STATE]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...initialState,
      inOnboarding: action.payload,
      enableFirstTimeUserExperience: state.enableFirstTimeUserExperience,
      firstTimeUserExperienceApplicationId:
        state.firstTimeUserExperienceApplicationId,
      showFirstTimeUserExperienceModal: state.showFirstTimeUserExperienceModal,
    };
  },
  [ReduxActionTypes.ADD_WIDGET_COMPLETE]: (state: OnboardingState) => {
    return {
      ...state,
      addedWidget: true,
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
  [ReduxActionTypes.SHOW_ONBOARDING_HELPER]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showHelper: action.payload,
    };
  },
  [ReduxActionTypes.SET_HELPER_CONFIG]: (
    state: OnboardingState,
    action: ReduxAction<OnboardingHelperConfig>,
  ) => {
    return {
      ...state,
      helperStepConfig: action.payload,
    };
  },
  [ReduxActionTypes.SET_ONBOARDING_SUBSTEP]: (
    state: OnboardingState,
    action: ReduxAction<number>,
  ) => {
    return {
      ...state,
      currentSubstep: action.payload,
    };
  },
  [ReduxActionTypes.SHOW_ONBOARDING_WELCOME_HELPER]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showWelcomeHelper: action.payload,
    };
  },
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (state: OnboardingState) => {
    return {
      ...state,
      ...initialState,
      enableFirstTimeUserExperience: state.enableFirstTimeUserExperience,
      firstTimeUserExperienceApplicationId:
        state.firstTimeUserExperienceApplicationId,
      showFirstTimeUserExperienceModal: state.showFirstTimeUserExperienceModal,
    };
  },
  [ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      inOnboardingWidgetSelection: action.payload,
    };
  },
  [ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_EXPERIENCE]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      enableFirstTimeUserExperience: action.payload,
    };
  },
  [ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_APPLICATION_ID]: (
    state: OnboardingState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      firstTimeUserExperienceApplicationId: action.payload,
    };
  },
  [ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_COMPLETE]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      firstTimeUserExperienceComplete: action.payload,
    };
  },
  [ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_EXPERIENCE_MODAL]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showFirstTimeUserExperienceModal: action.payload,
    };
  },
});

export default onboardingReducer;
