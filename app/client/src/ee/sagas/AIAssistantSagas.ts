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
) {
  try {
    const { prompt, context } = action.payload;
    const aiState = yield select(getAIAssistantState);

    if (!aiState.isEnabled || !aiState.provider) {
      yield put(
        fetchAIResponseError({
          error: "AI Assistant is disabled. Please contact your administrator to enable it.",
        }),
      );
      return;
    }

    const response = yield call(
      UserApi.requestAIResponse,
      aiState.provider,
      prompt,
      context,
    );

    if (response.data.responseMeta.success) {
      yield put(fetchAIResponseSuccess({
        response: response.data.data.response,
      }));
    } else {
      yield put(fetchAIResponseError({
        error: response.data.responseMeta.error?.message || "Failed to get AI response",
      }));
      toast.show(response.data.responseMeta.error?.message || "Failed to get AI response", { kind: "error" });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get AI response";
    yield put(fetchAIResponseError({ error: errorMessage }));
    toast.show(errorMessage, { kind: "error" });
  }
}

function* loadAISettingsSaga() {
  try {
    const response = yield call(OrganizationApi.getAIConfig);

    if (response.data.responseMeta.success) {
      const config = response.data.data;
      yield put(updateAISettings({
        provider: config.provider || undefined,
        hasApiKey: config.hasClaudeApiKey || config.hasOpenaiApiKey,
        isEnabled: config.isAIAssistantEnabled || false,
      }));
    } else {
      yield put(updateAISettings({ provider: undefined, hasApiKey: false, isEnabled: false }));
    }
  } catch (error) {
    yield put(updateAISettings({ provider: undefined, hasApiKey: false, isEnabled: false }));
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
}
