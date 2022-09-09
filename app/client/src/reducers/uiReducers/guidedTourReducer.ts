import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: GuidedTourState = {
  guidedTour: false,
  loading: false,
  exploring: false,
  currentStep: 1,
  showSuccessMessage: false,
  showInfoMessage: false,
  tableWidgetWasSelected: false,
  hadReachedStep: 0,
  showEndTourDialog: false,
  showDeviatingDialog: false,
  showPostCompletionMessage: false,
  forceShowContent: 0,
};

export interface GuidedTourState {
  guidedTour: boolean;
  loading: boolean;
  exploring: boolean;
  currentStep: number;
  showSuccessMessage: boolean;
  showInfoMessage: boolean;
  tableWidgetWasSelected: boolean;
  hadReachedStep: number;
  showEndTourDialog: boolean;
  showDeviatingDialog: boolean;
  showPostCompletionMessage: boolean;
  forceShowContent: number;
}

const guidedTourReducer = createReducer(initialState, {
  [ReduxActionTypes.ENABLE_GUIDED_TOUR]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      ...initialState,
      guidedTour: action.payload,
      exploring: action.payload,
    };
  },
  [ReduxActionTypes.GUIDED_TOUR_TOGGLE_LOADER]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      loading: action.payload,
      exploring: !action.payload ? false : state.exploring,
    };
  },
  [ReduxActionTypes.SET_CURRENT_STEP]: (
    state: GuidedTourState,
    action: ReduxAction<number>,
  ) => {
    if (action.payload === state.currentStep) {
      return state;
    }

    return {
      ...state,
      currentStep: action.payload,
      showSuccessMessage: false,
      showInfoMessage: false,
      hadReachedStep:
        action.payload > state.hadReachedStep
          ? action.payload
          : state.hadReachedStep,
    };
  },
  [ReduxActionTypes.SHOW_INFO_MESSAGE]: (state: GuidedTourState) => {
    return {
      ...state,
      showInfoMessage: true,
    };
  },
  [ReduxActionTypes.GUIDED_TOUR_MARK_STEP_COMPLETED]: (
    state: GuidedTourState,
  ) => {
    return {
      ...state,
      showSuccessMessage: true,
    };
  },
  [ReduxActionTypes.TABLE_WIDGET_WAS_SELECTED]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      tableWidgetWasSelected: action.payload,
    };
  },
  [ReduxActionTypes.TOGGLE_DEVIATION_DIALOG]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showDeviatingDialog: action.payload,
    };
  },
  [ReduxActionTypes.TOGGLE_END_GUIDED_TOUR_DIALOG]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showEndTourDialog: action.payload,
    };
  },
  [ReduxActionTypes.SHOW_POST_COMPLETION_MESSAGE]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showPostCompletionMessage: action.payload,
    };
  },
  [ReduxActionTypes.FORCE_SHOW_CONTENT]: (
    state: GuidedTourState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      forceShowContent: action.payload,
    };
  },
  [ReduxActionTypes.LOAD_GUIDED_TOUR]: (
    state: GuidedTourState,
    action: ReduxAction<GuidedTourState>,
  ) => {
    return {
      ...state,
      ...action.payload,
    };
  },
});

export default guidedTourReducer;
