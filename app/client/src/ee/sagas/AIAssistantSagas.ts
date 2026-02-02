import { call, put, select, takeLatest } from "redux-saga/effects";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  fetchAIResponseSuccess,
  fetchAIResponseError,
  type FetchAIResponsePayload,
  updateAISettings,
} from "ee/actions/aiAssistantActions";
import UserApi from "ee/api/UserApi";
import OrganizationApi from "ee/api/OrganizationApi";
import { getAIAssistantState } from "ee/selectors/aiAssistantSelectors";
import { toast } from "@appsmith/ads";

function* fetchAIResponseSaga(
  action: ReduxAction<FetchAIResponsePayload>,
): Generator<unknown, void, unknown> {
  try {
    const { context, prompt } = action.payload;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiState: any = yield select(getAIAssistantState);

    if (!aiState.isEnabled || !aiState.provider) {
      yield put(
        fetchAIResponseError({
          error:
            "AI Assistant is disabled. Please contact your administrator to enable it.",
        }),
      );

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(
      UserApi.requestAIResponse,
      aiState.provider,
      prompt,
      context,
    );

    // Handle both wrapped (axios raw) and unwrapped (interceptor) response formats
    // If response has responseMeta at root, it's already unwrapped
    // Otherwise, the actual API response is in response.data
    const hasResponseMeta = response?.responseMeta !== undefined;
    const responseBody = hasResponseMeta ? response : response?.data;

    const responseMeta = responseBody?.responseMeta;
    const isSuccess = responseMeta?.success ?? false;

    if (isSuccess && responseBody?.data?.response) {
      yield put(
        fetchAIResponseSuccess({
          response: responseBody.data.response,
        }),
      );
    } else {
      // Extract error message from various possible locations
      const errorMsg =
        responseMeta?.error?.message ||
        responseBody?.data?.error ||
        responseBody?.errorMessage ||
        responseBody?.message ||
        "Failed to get AI response. Please check your AI settings.";

      yield put(fetchAIResponseError({ error: errorMsg }));
      toast.show(errorMsg, { kind: "error" });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get AI response";

    yield put(fetchAIResponseError({ error: errorMessage }));
    toast.show(errorMessage, { kind: "error" });
  }
}

function* loadAISettingsSaga(): Generator<unknown, void, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(OrganizationApi.getAIConfig);

    // The API can return data in two formats:
    // 1. Standard format: { responseMeta: { success: true }, data: { ... } }
    // 2. Direct format: { hasClaudeApiKey, hasOpenaiApiKey, ... } (from /ai-config endpoint)
    const responseData = response.data;
    const hasStandardFormat =
      responseData.responseMeta && responseData.responseMeta.success;
    const config = hasStandardFormat ? responseData.data : responseData;

    yield put(
      updateAISettings({
        provider: config.provider || undefined,
        hasApiKey: config.hasClaudeApiKey || config.hasOpenaiApiKey,
        isEnabled: config.isAIAssistantEnabled || false,
      }),
    );
  } catch (error) {
    yield put(
      updateAISettings({
        provider: undefined,
        hasApiKey: false,
        isEnabled: false,
      }),
    );
  }
}

export default function* aiAssistantSagasListener() {
  yield takeLatest(ReduxActionTypes.FETCH_AI_RESPONSE, fetchAIResponseSaga);
  yield takeLatest(
    ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
    loadAISettingsSaga,
  );
  yield takeLatest(
    ReduxActionTypes.FETCH_CURRENT_ORGANIZATION_CONFIG_SUCCESS,
    loadAISettingsSaga,
  );
  // Also load AI settings when editor initializes (in case user navigates directly)
  yield takeLatest(
    ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    loadAISettingsSaga,
  );
  // Explicit load action (can be dispatched from components)
  yield takeLatest(ReduxActionTypes.LOAD_AI_SETTINGS, loadAISettingsSaga);
}
