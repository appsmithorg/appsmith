import { takeLatest, put, all, select } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import type { CurlImportRequest } from "api/ImportApi";
import CurlImportApi from "api/ImportApi";
import type { ApiResponse } from "api/ApiResponses";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import transformCurlImport from "transformers/CurlImportTransformer";
import history from "utils/history";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { apiEditorIdURL } from "@appsmith/RouteBuilder";

export function* curlImportSaga(action: ReduxAction<CurlImportRequest>) {
  const { contextId, contextType, name, type } = action.payload;
  let { curl } = action.payload;
  try {
    curl = transformCurlImport(curl);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const request: CurlImportRequest = {
      type,
      contextId,
      name,
      curl,
      workspaceId,
      contextType,
    };

    const response: ApiResponse = yield CurlImportApi.curlImport(request);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      AnalyticsUtil.logEvent("IMPORT_API", {
        importSource: CURL,
      });

      yield put({
        type: ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
        payload: response.data,
      });

      history.push(
        // @ts-expect-error: response.data is of type unknown
        apiEditorIdURL({ parentEntityId: contextId, apiId: response.data.id }),
      );
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
