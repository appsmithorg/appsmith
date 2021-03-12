import { AppIconName } from "components/ads/AppIcon";
import { AppColorCode } from "constants/DefaultTheme";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";
export type CreateApplicationFormValues = {
  applicationName: string;
  orgId: string;
  colorCode?: AppColorCode;
  appName?: AppIconName;
};

export const CREATE_APPLICATION_FORM_NAME_FIELD = "applicationName";

export const createApplicationFormSubmitHandler = (
  values: CreateApplicationFormValues,
  dispatch: any,
): Promise<any> => {
  const { applicationName, orgId } = values;
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        resolve,
        reject,
        applicationName,
        orgId,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};
