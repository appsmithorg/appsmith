import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import { createReducer } from "utils/ReducerUtils";

const initialState: OnboardingState = {
  // Signposting
  inOnboardingWidgetSelection: false,
  forceOpenWidgetPanel: false,
  firstTimeUserOnboardingApplicationIds: [],
  firstTimeUserOnboardingComplete: false,
  showFirstTimeUserOnboardingModal: false,
  stepState: [],
};

export type StepState = {
  step: SIGNPOSTING_STEP;
  completed: boolean;
  read?: boolean;
};

export interface OnboardingState {
  inOnboardingWidgetSelection: boolean;
  forceOpenWidgetPanel: boolean;
  firstTimeUserOnboardingApplicationIds: string[];
  firstTimeUserOnboardingComplete: boolean;
  showFirstTimeUserOnboardingModal: boolean;
  stepState: StepState[];
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
  SIGNPOSTING_STEP_UPDATE: (
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
    console.log(newArray, "newArray-SIGNPOSTING");
    console.log(action.payload, "action-SIGNPOSTING");
    return {
      ...state,
      stepState: newArray,
    };
  },
  SIGNPOSTING_MARK_ALL_READ: (state: OnboardingState) => {
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
});

export default onboardingReducer;
