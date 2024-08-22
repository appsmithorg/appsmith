import type { ApiResponse } from "api/ApiResponses";
import type { CurlImportRequest } from "api/ImportApi";
import CurlImportApi from "api/ImportApi";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { apiEditorIdURL } from "ee/RouteBuilder";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import { convertToBaseParentEntityIdSelector } from "selectors/pageListSelectors";
import transformCurlImport from "transformers/CurlImportTransformer";
import history from "utils/history";

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

    const response: ApiResponse<{ id: string; baseId: string }> =
      yield CurlImportApi.curlImport(request);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      AnalyticsUtil.logEvent("IMPORT_API", {
        importSource: CURL,
      });

      yield put({
        type: ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
        payload: response.data,
      });
      const baseParentEntityId: string = yield select(
        convertToBaseParentEntityIdSelector,
        contextId,
      );
      history.push(
        apiEditorIdURL({
          baseParentEntityId: baseParentEntityId,
          baseApiId: response.data.baseId,
        }),
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
