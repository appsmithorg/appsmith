import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: OnboardingState = {
  // Signposting
  inOnboardingWidgetSelection: false,
  forceOpenWidgetPanel: false,
  firstTimeUserOnboardingApplicationIds: [],
  firstTimeUserOnboardingComplete: false,
  showFirstTimeUserOnboardingModal: false,
};

export interface OnboardingState {
  inOnboardingWidgetSelection: boolean;
  forceOpenWidgetPanel: boolean;
  firstTimeUserOnboardingApplicationIds: string[];
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
  [ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS]: (
    state: OnboardingState,
    action: ReduxAction<string[]>,
  ) => {
    return {
      ...state,
      firstTimeUserOnboardingApplicationIds: action.payload,
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
