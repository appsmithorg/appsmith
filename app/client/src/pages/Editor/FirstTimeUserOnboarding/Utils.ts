import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Dispatch } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
export const triggerWelcomeTour = (dispatch: Dispatch<any>) => {
  AnalyticsUtil.logEvent("SIGNPOSTING_WELCOME_TOUR_CLICK");
  dispatch({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: false,
  });
  dispatch({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: "",
  });
  dispatch({
    type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
  });
};
