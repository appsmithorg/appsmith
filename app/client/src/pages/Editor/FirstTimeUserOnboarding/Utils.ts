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

export enum SIGNPOSTING_STEP {
  CONNECT_A_DATASOURCE = "CONNECT_A_DATASOURCE",
  CREATE_A_QUERY = "CREATE_A_QUERY",
  ADD_WIDGETS = "ADD_WIDGETS",
  CONNECT_DATA_TO_WIDGET = "CONNECT_DATA_TO_WIDGET",
  DEPLOY_APPLICATIONS = "DEPLOY_APPLICATIONS",
}
