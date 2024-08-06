import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";

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
  basePageId: string,
  suffix?: string,
) => {
  return {
    type: ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
    payload: {
      applicationId,
      basePageId,
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

export const showInfoMessage = () => {
  return {
    type: ReduxActionTypes.SHOW_INFO_MESSAGE,
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

export const resetCurrentPluginIdForCreateNewApp = () => {
  return {
    type: ReduxActionTypes.RESET_CURRENT_PLUGIN_ID_FOR_CREATE_NEW_APP,
  };
};
