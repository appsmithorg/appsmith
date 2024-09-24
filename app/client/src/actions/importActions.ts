import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

import type { CurlImportFormValues } from "../pages/Editor/CurlImport/helpers";

export const submitCurlImportForm = (payload: CurlImportFormValues) => {
  return {
    type: ReduxActionTypes.SUBMIT_CURL_FORM_INIT,
    payload,
  };
};
