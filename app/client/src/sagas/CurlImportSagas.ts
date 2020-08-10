import { takeLatest, put, all, select, take } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import CurlImportApi, { CurlImportRequest } from "api/ImportApi";
import { ApiResponse } from "api/ApiResponses";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { ToastType } from "react-toastify";
import { CURL_IMPORT_SUCCESS } from "constants/messages";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { fetchActions } from "actions/actionActions";
import { CURL } from "constants/ApiConstants";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import transformCurlImport from "transformers/CurlImportTransformer";
import { API_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";

export function* curlImportSaga(action: ReduxAction<CurlImportRequest>) {
  const { type, pageId, name } = action.payload;
  let { curl } = action.payload;
  try {
    curl = transformCurlImport(curl);
    const organizationId = yield select(getCurrentOrgId);
    const request: CurlImportRequest = {
      type,
      pageId,
      name,
      curl,
      organizationId,
    };

    const response: ApiResponse = yield CurlImportApi.curlImport(request);
    const isValidResponse = yield validateResponse(response);
    const applicationId = yield select(getCurrentApplicationId);

    if (isValidResponse) {
      AnalyticsUtil.logEvent("IMPORT_API", {
        importSource: CURL,
      });

      yield put(fetchActions(applicationId));
      yield take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS);

      AppToaster.show({
        message: CURL_IMPORT_SUCCESS,
        type: ToastType.SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
        payload: response.data,
      });

      history.push(API_EDITOR_ID_URL(applicationId, pageId, response.data.id));
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
