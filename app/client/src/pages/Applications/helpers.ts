import type { AppIconName } from "design-system-old";
import type { AppColorCode } from "constants/DefaultTheme";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";

import { truncateString, howMuchTimeBeforeText } from "utils/helpers";

export interface CreateApplicationFormValues {
  applicationName: string;
  workspaceId: string;
  colorCode?: AppColorCode;
  appName?: AppIconName;
}

export interface EditedByTextProps {
  modifiedAt?: string;
  modifiedBy?: string;
}

export const CREATE_APPLICATION_FORM_NAME_FIELD = "applicationName";

export const createApplicationFormSubmitHandler = async (
  values: CreateApplicationFormValues,
  dispatch: any,
): Promise<any> => {
  const { applicationName, workspaceId } = values;
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        resolve,
        reject,
        applicationName,
        workspaceId,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};

export const generateEditedByText = ({
  modifiedAt,
  modifiedBy,
}: EditedByTextProps) => {
  let editedBy = modifiedBy ? modifiedBy : "";
  let editedOn = modifiedAt ? modifiedAt : "";

  if (editedBy === "" && editedOn === "") return "";

  editedBy = editedBy.split("@")[0];
  editedBy = truncateString(editedBy, 9);

  //assuming modifiedAt will be always available
  editedOn = howMuchTimeBeforeText(editedOn);
  editedOn = editedOn !== "" ? editedOn + " ago" : "";
  return editedBy + " edited " + editedOn;
};
