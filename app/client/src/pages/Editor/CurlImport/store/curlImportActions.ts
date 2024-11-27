import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface CurlImportFormValues {
  curl: string;
  contextId: string;
  name: string;
  contextType: ActionParentEntityTypeInterface;
}

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
