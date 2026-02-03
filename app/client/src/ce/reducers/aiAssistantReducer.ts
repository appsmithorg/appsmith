import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  UpdateAISettingsPayload,
  AIMessage,
  FetchAIResponsePayload,
} from "ee/actions/aiAssistantActions";

const MAX_MESSAGES = 20;

export interface AIAssistantReduxState {
  provider?: string;
  hasApiKey: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  messages: AIMessage[];
  error?: string;
}

const initialState: AIAssistantReduxState = {
  hasApiKey: false,
  isEnabled: false,
  isLoading: false,
  messages: [],
};

function appendMessage(
  messages: AIMessage[],
  newMessage: AIMessage,
): AIMessage[] {
  const trimmed = messages.slice(-(MAX_MESSAGES - 1));

  return [...trimmed, newMessage];
}

export const aiAssistantReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_AI_SETTINGS]: (
    state: AIAssistantReduxState,
    action: ReduxAction<UpdateAISettingsPayload>,
  ) => ({
    ...state,
    provider: action.payload.provider || state.provider,
    hasApiKey: action.payload.hasApiKey ?? state.hasApiKey,
    isEnabled: action.payload.isEnabled ?? state.isEnabled,
  }),
  [ReduxActionTypes.FETCH_AI_RESPONSE]: (
    state: AIAssistantReduxState,
    action: ReduxAction<FetchAIResponsePayload>,
  ) => ({
    ...state,
    isLoading: true,
    error: undefined,
    messages: appendMessage(state.messages, {
      role: "user",
      content: action.payload.prompt,
      timestamp: Date.now(),
    }),
  }),
  [ReduxActionTypes.FETCH_AI_RESPONSE_SUCCESS]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ response: string }>,
  ) => ({
    ...state,
    isLoading: false,
    error: undefined,
    messages: appendMessage(state.messages, {
      role: "assistant",
      content: action.payload.response,
      timestamp: Date.now(),
    }),
  }),
  [ReduxActionTypes.FETCH_AI_RESPONSE_ERROR]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ error: string }>,
  ) => ({
    ...state,
    isLoading: false,
    error: action.payload.error,
  }),
  [ReduxActionTypes.CLEAR_AI_RESPONSE]: (state: AIAssistantReduxState) => ({
    ...state,
    messages: [],
    error: undefined,
  }),
});
