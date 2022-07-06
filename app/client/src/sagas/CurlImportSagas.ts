import { takeLatest, put, all, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import CurlImportApi, { CurlImportRequest } from "api/ImportApi";
import { ApiResponse } from "api/ApiResponses";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  CURL_IMPORT_SUCCESS,
} from "@appsmith/constants/messages";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import transformCurlImport from "transformers/CurlImportTransformer";
import history from "utils/history";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { apiEditorIdURL } from "RouteBuilder";

export function* curlImportSaga(action: ReduxAction<CurlImportRequest>) {
  const { name, pageId, type } = action.payload;
  let { curl } = action.payload;
  try {
    curl = transformCurlImport(curl);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const request: CurlImportRequest = {
      type,
      pageId,
      name,
      curl,
      workspaceId,
    };

    const response: ApiResponse = yield CurlImportApi.curlImport(request);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      AnalyticsUtil.logEvent("IMPORT_API", {
        importSource: CURL,
      });

      Toaster.show({
        text: createMessage(CURL_IMPORT_SUCCESS),
        variant: Variant.success,
      });
      yield put({
        type: ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
        payload: response.data,
      });

      // @ts-expect-error: response.data is of type unknown
      history.push(apiEditorIdURL({ pageId, apiId: response.data.id }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SUBMIT_CURL_FORM_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* curlImportSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SUBMIT_CURL_FORM_INIT, curlImportSaga),
  ]);
}
