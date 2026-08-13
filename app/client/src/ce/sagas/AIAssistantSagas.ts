import {
  call,
  delay,
  put,
  race,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
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
  getIsAIConfigLoaded,
} from "ee/selectors/aiAssistantSelectors";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Ask AI is CE-owned; CE cannot add an ee/ shim (pre-push architecture guard).
import type {
  AIAssistantReduxState,
  AIEditorContext,
} from "ce/reducers/aiAssistantReducer";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
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

// Only a failure that might succeed on a second attempt is worth retrying. Retrying everything meant an invalid
// API key, a malformed request or a quota rejection each cost a SECOND completion call to the provider — double
// latency and double spend for an outcome that was never going to change.
function isRetriableFailure(message: string | undefined): boolean {
  if (!message) {
    // No message to classify (e.g. a network-level throw): treat as transient.
    return true;
  }

  const text = message.toLowerCase();
  const permanent = [
    "invalid api key",
    "unauthorized",
    "forbidden",
    "access denied",
    "invalid credentials",
    "quota",
    "billing",
    "not enabled",
    "disabled",
    "invalid provider",
    "too long",
    "invalid parameter",
  ];

  if (permanent.some((needle) => text.includes(needle))) {
    return false;
  }

  // Rate limiting is transient by definition, and so are timeouts and upstream 5xx.
  return true;
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

function* fetchAIResponseSaga(
  action: ReduxAction<FetchAIResponsePayload>,
): Generator<unknown, void, unknown> {
  try {
    const { context, prompt } = action.payload;

    if (!prompt?.trim()) {
      yield put(fetchAIResponseError({ error: "Please enter a prompt." }));

      return;
    }

    let aiState = (yield select(getAIAssistantState)) as AIAssistantReduxState;

    if (!aiState.isEnabled || !aiState.provider) {
      yield put(loadAISettings());

      const { timeout } = (yield race({
        settings: take(ReduxActionTypes.UPDATE_AI_SETTINGS),
        timeout: delay(10000),
      })) as { settings?: unknown; timeout?: boolean };

      if (timeout) {
        yield put(
          fetchAIResponseError({
            error: "Failed to load AI settings. Please try again.",
          }),
        );

        return;
      }

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

    const editorContext = (yield select(
      getAIEditorContext,
    )) as AIEditorContext | null;

    // The server authorizes every request against the entity when there is one, and against the application
    // otherwise — Ask AI only exists in the editor, so a caller who cannot edit either has no legitimate route
    // here. Send the application id so a request with no entity (a widget property binding, say) still carries
    // something to authorize.
    const applicationId = (yield select(getCurrentApplicationId)) as
      | string
      | undefined;

    const enrichedContext = {
      ...(context || {}),
      ...(editorContext?.entityId ? { entityId: editorContext.entityId } : {}),
      ...(applicationId ? { applicationId } : {}),
    };

    // Build conversation history from state, excluding the just-added user message
    const messages = aiState.messages || [];

    const conversationHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const MAX_ATTEMPTS = 2;
    const RETRY_DELAY_MS = 1000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = yield call(
          UserApi.requestAIResponse,
          aiState.provider,
          prompt,
          enrichedContext,
          conversationHistory.length > 0 ? conversationHistory : undefined,
        );

        const responseBody: AIResponseBody =
          response?.responseMeta !== undefined ? response : response?.data;

        const isSuccess = responseBody?.responseMeta?.success ?? false;

        if (isSuccess && responseBody?.data?.response) {
          yield put(
            fetchAIResponseSuccess({ response: responseBody.data.response }),
          );

          return;
        }

        const errorMsg = extractErrorMessage(responseBody);

        if (attempt < MAX_ATTEMPTS && isRetriableFailure(errorMsg)) {
          yield delay(RETRY_DELAY_MS);
          continue;
        }

        yield put(fetchAIResponseError({ error: errorMsg }));
        toast.show(errorMsg, { kind: "error" });
      } catch (error: unknown) {
        const thrownMessage =
          error instanceof Error ? error.message : undefined;

        if (
          attempt < MAX_ATTEMPTS &&
          (isTimeoutError(error) || isRetriableFailure(thrownMessage))
        ) {
          yield delay(RETRY_DELAY_MS);
          continue;
        }

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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get AI response";

    yield put(fetchAIResponseError({ error: errorMessage }));
    toast.show(errorMessage, { kind: "error" });
  }
}

/**
 * Cancels the active saga when a caller explicitly stops generation. The
 * reducer also rejects late completions, which protects against providers that
 * cannot abort an HTTP request already in flight.
 */
function* cancellableFetchAIResponseSaga(
  action: ReduxAction<FetchAIResponsePayload>,
): Generator<unknown, void, unknown> {
  yield race({
    request: call(fetchAIResponseSaga, action),
    cancel: take(ReduxActionTypes.CANCEL_AI_RESPONSE),
  });
}

interface AIConfigResponse {
  provider?: string;
  hasClaudeApiKey?: boolean;
  hasOpenaiApiKey?: boolean;
  hasAzureOpenaiApiKey?: boolean;
  hasLocalLlmUrl?: boolean;
  // Only returned to organization managers; non-managers get hasLocalLlmUrl instead.
  localLlmUrl?: string;
  isAIAssistantEnabled?: boolean;
}

function* loadAISettingsSaga(
  action?: ReduxAction<unknown>,
): Generator<unknown, void, unknown> {
  const isExplicitLoad = action?.type === ReduxActionTypes.LOAD_AI_SETTINGS;

  const isAlreadyLoaded = (yield select(getIsAIConfigLoaded)) as boolean;

  if (isAlreadyLoaded && !isExplicitLoad) {
    return;
  }

  const currentUser = (yield select(getCurrentUser)) as
    | { email?: string; isAnonymous?: boolean }
    | undefined;

  if (
    !currentUser ||
    currentUser.isAnonymous ||
    currentUser.email === ANONYMOUS_USERNAME
  ) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = yield call(OrganizationApi.getAIConfig);

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
            config.hasLocalLlmUrl ||
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
  yield takeLatest(
    ReduxActionTypes.FETCH_AI_RESPONSE,
    cancellableFetchAIResponseSaga,
  );
  yield takeLatest(
    ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
    loadAISettingsSaga,
  );
  yield takeLatest(ReduxActionTypes.LOAD_AI_SETTINGS, loadAISettingsSaga);
}
