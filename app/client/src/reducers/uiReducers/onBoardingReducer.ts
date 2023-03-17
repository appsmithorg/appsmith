import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: OnboardingState = {
  // Signposting
  inOnboardingWidgetSelection: false,
  enableFirstTimeUserOnboarding: false,
  forceOpenWidgetPanel: false,
  firstTimeUserOnboardingApplicationId: "",
  firstTimeUserOnboardingComplete: false,
  showFirstTimeUserOnboardingModal: false,
};

export interface OnboardingState {
  inOnboardingWidgetSelection: boolean;
  enableFirstTimeUserOnboarding: boolean;
  forceOpenWidgetPanel: boolean;
  firstTimeUserOnboardingApplicationId: string;
  firstTimeUserOnboardingComplete: boolean;
  showFirstTimeUserOnboardingModal: boolean;
}

const onboardingReducer = createReducer(initialState, {
  [ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      inOnboardingWidgetSelection: action.payload,
    };
  },
  [ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      enableFirstTimeUserOnboarding: action.payload,
    };
  },
  [ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID]: (
    state: OnboardingState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      firstTimeUserOnboardingApplicationId: action.payload,
    };
  },
  [ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      firstTimeUserOnboardingComplete: action.payload,
    };
  },
  [ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showFirstTimeUserOnboardingModal: action.payload,
    };
  },
  [ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, forceOpenWidgetPanel: action.payload };
  },
});

export default onboardingReducer;
