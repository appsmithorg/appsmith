import { call, put, select, take, takeLatest } from "redux-saga/effects";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  fetchAIResponseSuccess,
  fetchAIResponseError,
  type FetchAIResponsePayload,
  loadAISettings,
  updateAISettings,
} from "ee/actions/aiAssistantActions";
import UserApi from "ee/api/UserApi";
import OrganizationApi from "ee/api/OrganizationApi";
import {
  getAIAssistantState,
  getAIEditorContext,
} from "ee/selectors/aiAssistantSelectors";
import type {
  AIAssistantReduxState,
  AIEditorContext,
} from "ee/reducers/aiAssistantReducer";
import {
  getActions,
  getDatasourceStructureById,
  getPluginNameFromId,
} from "ee/selectors/entitiesSelector";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { DatasourceStructure } from "entities/Datasource";
import { serializeDatasourceSchema } from "ee/utils/aiSchemaSerializer";
import { toast } from "@appsmith/ads";

interface AIResponseBody {
  responseMeta?: { success?: boolean; error?: { message?: string } };
  data?: { response?: string; error?: string };
  errorMessage?: string;
  message?: string;
}

function extractErrorMessage(responseBody: AIResponseBody): string {
  return (
    responseBody?.responseMeta?.error?.message ||
    responseBody?.data?.error ||
    responseBody?.errorMessage ||
    responseBody?.message ||
    "Failed to get AI response. Please check your AI settings."
  );
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    if (
      error.message.includes("timeout") ||
      error.message.includes("taking too long")
    ) {
      return true;
    }
  }

  const code = (error as { code?: string })?.code;

  return code === "ECONNABORTED" || code === "REQUEST_TIMEOUT";
}

/**
 * Enriches the request context with database schema information when the
 * current editor is a SQL query. Looks up the action's datasource structure
 * and serializes it into a compact string for LLM context.
 */
function* enrichContextWithSchema(
  enrichedContext: FetchAIResponsePayload["context"] & Record<string, unknown>,
): Generator<unknown, void, unknown> {
  const editorContext = (yield select(
    getAIEditorContext,
  )) as AIEditorContext | null;

  if (!editorContext?.entityName || !editorContext?.mode?.includes("sql")) {
    return;
  }

  const allActions = (yield select(getActions)) as ActionDataState;
  const matchedAction = allActions.find(
    (a) => a.config.name === editorContext.entityName,
  );

  const datasourceId = matchedAction?.config?.datasource?.id;
  const pluginId = matchedAction?.config?.pluginId;

  if (!datasourceId || !pluginId) return;

  const structure = (yield select(getDatasourceStructureById, datasourceId)) as
    | DatasourceStructure
    | undefined;

  if (!structure?.tables?.length) return;

  const currentSql = enrichedContext.currentValue || "";
  const schema = serializeDatasourceSchema(structure, currentSql, 10000);

  if (schema) {
    enrichedContext.databaseSchema = schema;
  }

  const pluginName = (yield select(getPluginNameFromId, pluginId)) as string;

  if (pluginName) {
    enrichedContext.datasourceType = pluginName;
  }
}

function* fetchAIResponseSaga(
  action: ReduxAction<FetchAIResponsePayload>,
): Generator<unknown, void, unknown> {
  try {
    const { context, prompt } = action.payload;
    let aiState = (yield select(getAIAssistantState)) as AIAssistantReduxState;

    // If settings not loaded yet (e.g. first time opening editor), load once and retry
    if (!aiState.isEnabled || !aiState.provider) {
      yield put(loadAISettings());
      yield take(ReduxActionTypes.UPDATE_AI_SETTINGS);
      aiState = (yield select(getAIAssistantState)) as AIAssistantReduxState;
    }

    if (!aiState.isEnabled || !aiState.provider) {
      yield put(
        fetchAIResponseError({
          error:
            "AI Assistant is disabled. Please contact your administrator to enable it.",
        }),
      );

      return;
    }

    const enrichedContext = { ...(context || {}) };

    yield* enrichContextWithSchema(enrichedContext);

    // Build conversation history from state, excluding the just-added user message
    const messages = aiState.messages || [];

    const conversationHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(
      UserApi.requestAIResponse,
      aiState.provider,
      prompt,
      enrichedContext,
      conversationHistory.length > 0 ? conversationHistory : undefined,
    );

    // Normalize response format (axios raw vs interceptor unwrapped)
    const responseBody: AIResponseBody =
      response?.responseMeta !== undefined ? response : response?.data;

    const isSuccess = responseBody?.responseMeta?.success ?? false;

    if (isSuccess && responseBody?.data?.response) {
      yield put(
        fetchAIResponseSuccess({ response: responseBody.data.response }),
      );
    } else {
      const errorMsg = extractErrorMessage(responseBody);

      yield put(fetchAIResponseError({ error: errorMsg }));
      toast.show(errorMsg, { kind: "error" });
    }
  } catch (error: unknown) {
    const errorMessage = isTimeoutError(error)
      ? "AI response timed out. Your LLM may be loading the model — please wait a moment and try again. " +
        "If this persists, try a smaller model or check that your LLM server is responsive."
      : error instanceof Error
        ? error.message
        : "Failed to get AI response";

    yield put(fetchAIResponseError({ error: errorMessage }));
    toast.show(errorMessage, { kind: "error" });
  }
}

interface AIConfigResponse {
  provider?: string;
  hasClaudeApiKey?: boolean;
  hasOpenaiApiKey?: boolean;
  hasAzureOpenaiApiKey?: boolean;
  localLlmUrl?: string;
  isAIAssistantEnabled?: boolean;
}

function* loadAISettingsSaga(): Generator<unknown, void, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(OrganizationApi.getAIConfig);

    // Normalize response format (standard wrapped vs direct)
    const responseData = response.data;
    const config: AIConfigResponse = responseData?.responseMeta?.success
      ? responseData.data
      : responseData;

    yield put(
      updateAISettings({
        provider: config.provider,
        hasApiKey: Boolean(
          config.hasClaudeApiKey ||
            config.hasOpenaiApiKey ||
            config.hasAzureOpenaiApiKey ||
            config.localLlmUrl,
        ),
        isEnabled: Boolean(config.isAIAssistantEnabled),
      }),
    );
  } catch {
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
