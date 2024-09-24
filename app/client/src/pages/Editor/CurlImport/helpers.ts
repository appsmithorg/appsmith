import { submitCurlImportForm } from "../../../actions/importActions";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface CurlImportFormValues {
  curl: string;
  contextId: string;
  name: string;
  contextType: ActionParentEntityTypeInterface;
}

export const curlImportSubmitHandler = (
  values: CurlImportFormValues,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
) => {
  dispatch(submitCurlImportForm(values));
};

export const openCurlImportModal = () => {
  return {
    type: ReduxActionTypes.SET_CURL_MODAL_OPEN,
  };
};

export const closeCurlImportModal = () => {
  return {
    type: ReduxActionTypes.SET_CURL_MODAL_CLOSE,
  };
};
