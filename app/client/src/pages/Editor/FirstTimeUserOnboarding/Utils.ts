import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";
import { Dispatch } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
export const triggerWelcomeTour = (dispatch: Dispatch<any>) => {
  AnalyticsUtil.logEvent("SIGNPOSTING_WELCOME_TOUR_CLICK");
  history.push(APPLICATIONS_URL);
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
