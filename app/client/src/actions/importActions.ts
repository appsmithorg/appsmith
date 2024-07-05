import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

import type { curlImportFormValues } from "../pages/Editor/CurlImport/helpers";

export const submitCurlImportForm = (payload: curlImportFormValues) => {
  return {
    type: ReduxActionTypes.SUBMIT_CURL_FORM_INIT,
    payload,
  };
};
