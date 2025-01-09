import type { ReduxAction } from "../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import { createReducer } from "utils/ReducerUtils";

const initialState: OnboardingState = {
  // Signposting
  inOnboardingWidgetSelection: false,
  forceOpenWidgetPanel: false,
  firstTimeUserOnboardingApplicationIds: [],
  firstTimeUserOnboardingComplete: false,
  showFirstTimeUserOnboardingModal: false,
  setOverlay: false,
  stepState: [],
  showSignpostingTooltip: false,
  showAnonymousDataPopup: false,
};

export interface StepState {
  step: SIGNPOSTING_STEP;
  completed: boolean;
  read?: boolean;
}

export interface OnboardingState {
  inOnboardingWidgetSelection: boolean;
  forceOpenWidgetPanel: boolean;
  firstTimeUserOnboardingApplicationIds: string[];
  firstTimeUserOnboardingComplete: boolean;
  showFirstTimeUserOnboardingModal: boolean;
  stepState: StepState[];
  setOverlay: boolean;
  showSignpostingTooltip: boolean;
  showAnonymousDataPopup: boolean;
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
  [ReduxActionTypes.SIGNPOSTING_STEP_UPDATE]: (
    state: OnboardingState,
    action: ReduxAction<StepState>,
  ) => {
    const index = state.stepState.findIndex(
      (stepState) => stepState.step === action.payload.step,
    );
    const newArray = [...state.stepState];

    if (index >= 0) {
      newArray[index] = action.payload;
    } else {
      newArray.push(action.payload);
    }

    return {
      ...state,
      stepState: newArray,
    };
  },
  [ReduxActionTypes.SIGNPOSTING_MARK_ALL_READ]: (state: OnboardingState) => {
    return {
      ...state,
      stepState: state.stepState.map((step) => {
        if (step.completed) {
          return {
            ...step,
            read: true,
          };
        }

        return step;
      }),
    };
  },
  [ReduxActionTypes.SET_SIGNPOSTING_OVERLAY]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      setOverlay: action.payload,
    };
  },
  [ReduxActionTypes.SIGNPOSTING_SHOW_TOOLTIP]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showSignpostingTooltip: action.payload,
    };
  },
  [ReduxActionTypes.SHOW_ANONYMOUS_DATA_POPUP]: (
    state: OnboardingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showAnonymousDataPopup: action.payload,
    };
  },
});

export default onboardingReducer;
