import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import type { GUIDED_TOUR_STEPS } from "pages/Editor/GuidedTour/constants";
import type { GuidedTourState } from "reducers/uiReducers/guidedTourReducer";
import type { WidgetProps } from "widgets/BaseWidget";

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

export const removeFirstTimeUserOnboardingApplicationId = (
  applicationId: string,
) => {
  return {
    type: ReduxActionTypes.REMOVE_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: applicationId,
  };
};

export const showSignpostingModal = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
    payload,
  };
};

export const disableStartSignpostingAction = () => {
  return {
    type: ReduxActionTypes.DISABLE_START_SIGNPOSTING,
  };
};

export const firstTimeUserOnboardingInit = (
  applicationId: string | undefined,
  pageId: string,
  suffix?: string,
) => {
  return {
    type: ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
    payload: {
      applicationId: applicationId,
      pageId: pageId,
      suffix,
    },
  };
};

export const setSignpostingOverlay = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_SIGNPOSTING_OVERLAY,
    payload,
  };
};

export const signpostingMarkAllRead = () => {
  return {
    type: ReduxActionTypes.SIGNPOSTING_MARK_ALL_READ,
  };
};

export const signpostingStepUpdateInit = (payload: {
  step: SIGNPOSTING_STEP;
  completed: boolean;
}) => {
  return {
    type: ReduxActionTypes.SIGNPOSTING_STEP_UPDATE_INIT,
    payload,
  };
};

export const signpostingStepUpdate = (payload: {
  step: SIGNPOSTING_STEP;
  completed: boolean;
  read?: boolean;
}) => {
  return {
    type: ReduxActionTypes.SIGNPOSTING_STEP_UPDATE,
    payload,
  };
};

export const showSignpostingTooltip = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SIGNPOSTING_SHOW_TOOLTIP,
    payload,
  };
};

export const showAnonymousDataPopup = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SHOW_ANONYMOUS_DATA_POPUP,
    payload,
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

export const loadGuidedTourInit = () => {
  return {
    type: ReduxActionTypes.LOAD_GUIDED_TOUR_INIT,
  };
};

export const loadGuidedTour = (guidedTourState: GuidedTourState) => {
  return {
    type: ReduxActionTypes.LOAD_GUIDED_TOUR,
    payload: guidedTourState,
  };
};

export const setCurrentApplicationIdForCreateNewApp = (
  applicationId: string,
) => {
  return {
    type: ReduxActionTypes.SET_CURRENT_APPLICATION_ID_FOR_CREATE_NEW_APP,
    payload: applicationId,
  };
};

export const resetCurrentApplicationIdForCreateNewApp = () => {
  return {
    type: ReduxActionTypes.RESET_CURRENT_APPLICATION_ID_FOR_CREATE_NEW_APP,
  };
};

export const setCurrentPluginIdForCreateNewApp = (pluginId: string) => {
  return {
    type: ReduxActionTypes.SET_CURRENT_PLUGIN_ID_FOR_CREATE_NEW_APP,
    payload: pluginId,
  };
};

export const resetCurrentPluginIdForCreateNewApp = () => {
  return {
    type: ReduxActionTypes.RESET_CURRENT_PLUGIN_ID_FOR_CREATE_NEW_APP,
  };
};
