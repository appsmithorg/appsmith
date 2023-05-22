import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { removeFirstTimeUserOnboardingApplicationId } from "actions/onboardingActions";
import { APPLICATIONS_URL } from "constants/routes";
import type { Dispatch } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
export const triggerWelcomeTour = (
  dispatch: Dispatch<any>,
  applicationId: string,
) => {
  AnalyticsUtil.logEvent("SIGNPOSTING_WELCOME_TOUR_CLICK");
  history.push(APPLICATIONS_URL);
  dispatch(removeFirstTimeUserOnboardingApplicationId(applicationId));
  dispatch({
    type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
  });
};
