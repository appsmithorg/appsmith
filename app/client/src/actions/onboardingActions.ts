import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { GUIDED_TOUR_STEPS } from "pages/Editor/GuidedTour/constants";
import { WidgetProps } from "widgets/BaseWidget";

export const enableGuidedTour = (payload: boolean) => {
  return {
    type: ReduxActionTypes.ENABLE_GUIDED_TOUR,
    payload,
  };
};

export const toggleInOnboardingWidgetSelection = (payload: boolean) => {
  return {
    type: ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION,
    payload,
  };
};

export const firstTimeUserOnboardingInit = (
  applicationId: string | undefined,
  pageId: string,
) => {
  return {
    type: ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
    payload: {
      applicationId: applicationId,
      pageId: pageId,
    },
  };
};

export const markStepComplete = () => {
  return {
    type: ReduxActionTypes.GUIDED_TOUR_MARK_STEP_COMPLETED,
  };
};

export const tableWidgetWasSelected = (payload: boolean) => {
  return {
    type: ReduxActionTypes.TABLE_WIDGET_WAS_SELECTED,
    payload,
  };
};

export const setCurrentStepInit = (payload: GUIDED_TOUR_STEPS) => {
  return {
    type: ReduxActionTypes.SET_CURRENT_STEP_INIT,
    payload,
  };
};

export const setCurrentStep = (payload: GUIDED_TOUR_STEPS) => {
  return {
    type: ReduxActionTypes.SET_CURRENT_STEP,
    payload,
  };
};

export const addOnboardingWidget = (payload: Partial<WidgetProps>) => {
  return {
    type: ReduxActionTypes.GUIDED_TOUR_ADD_WIDGET,
    payload,
  };
};

export const setUpTourApp = () => {
  return {
    type: ReduxActionTypes.SET_UP_TOUR_APP,
  };
};

export const toggleLoader = (payload: boolean) => {
  return {
    type: ReduxActionTypes.GUIDED_TOUR_TOGGLE_LOADER,
    payload,
  };
};

export const toggleShowDeviationDialog = (payload: boolean) => {
  return {
    type: ReduxActionTypes.TOGGLE_DEVIATION_DIALOG,
    payload,
  };
};

export const toggleShowEndTourDialog = (payload: boolean) => {
  return {
    type: ReduxActionTypes.TOGGLE_END_GUIDED_TOUR_DIALOG,
    payload,
  };
};

export const showPostCompletionMessage = (payload: boolean) => {
  return {
    type: ReduxActionTypes.TOGGLE_END_GUIDED_TOUR_DIALOG,
    payload,
  };
};

export const forceShowContent = (payload: GUIDED_TOUR_STEPS) => {
  return {
    type: ReduxActionTypes.FORCE_SHOW_CONTENT,
    payload,
  };
};

export const updateButtonWidgetText = () => {
  return {
    type: ReduxActionTypes.UPDATE_BUTTON_WIDGET_TEXT,
  };
};

export const showInfoMessage = () => {
  return {
    type: ReduxActionTypes.SHOW_INFO_MESSAGE,
  };
};

export const focusWidget = (widgetName: string, propertyName?: string) => {
  return {
    type: ReduxActionTypes.GUIDED_TOUR_FOCUS_WIDGET,
    payload: {
      widgetName,
      propertyName,
    },
  };
};

export const focusWidgetProperty = (widgetName: string) => {
  return {
    type: ReduxActionTypes.FOCUS_WIDGET_PROPERTY,
    payload: widgetName,
  };
};

export const onboardingCreateApplication = () => {
  return {
    type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
  };
};
