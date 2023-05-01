import type {
  TAssistantPrompt,
  TChatGPTPrompt,
} from "@appsmith/components/editorComponents/GPT/utils";
import { isAssistantPrompt } from "@appsmith/components/editorComponents/GPT/utils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export interface AIReduxState {
  isAIWindowOpen: boolean;
  evaluationResults: Record<string, any>;
  messages: TChatGPTPrompt[];
}

const initialGPTState: AIReduxState = {
  isAIWindowOpen: false,
  evaluationResults: {},
  messages: [],
};

const handlers = {
  [ReduxActionTypes.TOGGLE_AI_WINDOW]: (
    state: AIReduxState,
    action: ReduxAction<boolean>,
  ) => {
    state.isAIWindowOpen = action.payload;
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
};

export default createImmerReducer(initialGPTState, handlers);
