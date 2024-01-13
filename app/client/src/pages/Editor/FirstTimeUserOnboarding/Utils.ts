import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";
import type { Dispatch } from "react";
import history from "utils/history";

export const triggerWelcomeTour = (dispatch: Dispatch<any>) => {
  history.push(APPLICATIONS_URL);
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
