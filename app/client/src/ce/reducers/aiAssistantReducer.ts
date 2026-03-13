import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  UpdateAISettingsPayload,
  AIMessage,
  FetchAIResponsePayload,
} from "ee/actions/aiAssistantActions";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

const MAX_MESSAGES = 20;

export interface AIEditorContext {
  functionName?: string;
  cursorLineNumber?: number;
  functionString?: string;
  mode?: string;
  currentValue?: string;
  editorId?: string;
  entityName?: string;
  propertyPath?: string;
}

export interface AIAssistantReduxState {
  provider?: string;
  hasApiKey: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  messages: AIMessage[];
  error?: string;
  isPanelOpen: boolean;
  noOfTimesAITriggered: number;
  noOfTimesAITriggeredForQuery: number;
  editorContext: AIEditorContext | null;
}

const initialState: AIAssistantReduxState = {
  hasApiKey: false,
  isEnabled: false,
  isLoading: false,
  messages: [],
  isPanelOpen: false,
  noOfTimesAITriggered: 0,
  noOfTimesAITriggeredForQuery: 0,
  editorContext: null,
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
  [ReduxActionTypes.OPEN_AI_PANEL]: (state: AIAssistantReduxState) => ({
    ...state,
    isPanelOpen: true,
  }),
  [ReduxActionTypes.CLOSE_AI_PANEL]: (state: AIAssistantReduxState) => ({
    ...state,
    isPanelOpen: false,
  }),
  [ReduxActionTypes.UPDATE_AI_TRIGGERED]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ value: number; mode: string }>,
  ) => {
    const isJavascriptMode =
      action.payload.mode === EditorModes.TEXT_WITH_BINDING;

    return {
      ...state,
      noOfTimesAITriggered: isJavascriptMode
        ? action.payload.value
        : state.noOfTimesAITriggered,
      noOfTimesAITriggeredForQuery: !isJavascriptMode
        ? action.payload.value
        : state.noOfTimesAITriggeredForQuery,
    };
  },
  [ReduxActionTypes.UPDATE_AI_CONTEXT]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ context: AIEditorContext }>,
  ) => ({
    ...state,
    editorContext: action.payload.context,
  }),
  [ReduxActionTypes.OPEN_AI_PANEL_WITH_CONTEXT]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ context: AIEditorContext }>,
  ) => ({
    ...state,
    editorContext: action.payload.context,
    isPanelOpen: true,
  }),
});
