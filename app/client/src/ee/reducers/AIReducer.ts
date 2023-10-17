import type {
  TAssistantPrompt,
  TChatGPTPrompt,
} from "@appsmith/components/editorComponents/GPT/utils";
import { isAssistantPrompt } from "@appsmith/components/editorComponents/GPT/utils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { createImmerReducer } from "utils/ReducerUtils";
import type { AIEditorContext } from "@appsmith/components/editorComponents/GPT";

export interface AIReduxState {
  evaluationResults: Record<string, any>;
  messages: TChatGPTPrompt[];
  showExamplePrompt: boolean;
  isLoading: boolean;
  context: AIEditorContext;
  noOfTimesAITriggered: number;
  noOfTimesAITriggeredForQuery: number;
}

const initialGPTState: AIReduxState = {
  evaluationResults: {},
  messages: [],
  showExamplePrompt: false,
  isLoading: false,
  context: {},
  noOfTimesAITriggered: 0,
  noOfTimesAITriggeredForQuery: 0,
};
const handlers = {
  [ReduxActionTypes.UPDATE_AI_CONTEXT]: (
    state: AIReduxState,
    action: ReduxAction<{
      show: boolean;
      context: AIEditorContext;
    }>,
  ) => {
    state.context = action.payload.context || {};
    state.showExamplePrompt = Boolean(!state.messages.length);
  },
  [ReduxActionTypes.EVALUATE_GPT_RESPONSE_COMPLETE]: (
    state: AIReduxState,
    action: ReduxAction<{ error: string; result: any; messageId: string }>,
  ) => {
    state.evaluationResults[action.payload.messageId] = action.payload.result;
  },
  [ReduxActionTypes.ADD_GPT_MESSAGE]: (
    state: AIReduxState,
    action: ReduxAction<TChatGPTPrompt>,
  ) => {
    state.messages.push(action.payload);
  },
  [ReduxActionTypes.UPDATE_GPT_MESSAGE]: (
    state: AIReduxState,
    action: ReduxAction<Partial<TAssistantPrompt>>,
  ) => {
    const { messageId } = action.payload;
    const messageIndex = state.messages.findIndex(
      (message) =>
        isAssistantPrompt(message) && message.messageId === messageId,
    );
    state.messages[messageIndex] = {
      ...(state.messages[messageIndex] as TAssistantPrompt),
      ...action.payload,
    };
  },
  [ReduxActionTypes.SHOW_EXAMPLE_GPT_PROMPT]: (
    state: AIReduxState,
    action: ReduxAction<boolean>,
  ) => {
    state.showExamplePrompt = action.payload;
  },
  [ReduxActionTypes.AI_LOADING]: (
    state: AIReduxState,
    action: ReduxAction<boolean>,
  ) => {
    state.isLoading = action.payload;
  },
  [ReduxActionTypes.UPDATE_AI_TRIGGERED]: (
    state: AIReduxState,
    action: {
      payload: { value: number; mode: string };
    },
  ) => {
    const { mode, value } = action.payload;

    if (mode === EditorModes.TEXT_WITH_BINDING) {
      state.noOfTimesAITriggered = value;
    } else {
      state.noOfTimesAITriggeredForQuery = value;
    }
  },
};

export default createImmerReducer(initialGPTState, handlers);
