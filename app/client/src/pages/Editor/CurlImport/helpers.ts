import { submitCurlImportForm } from "../../../actions/importActions";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface CurlImportFormValues {
  curl: string;
  contextId: string;
  name: string;
  contextType: ActionParentEntityTypeInterface;
}

export const curlImportSubmitHandler = (
  values: CurlImportFormValues,
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
