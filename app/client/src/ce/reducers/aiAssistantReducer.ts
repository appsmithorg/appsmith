import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import type { UpdateAISettingsPayload } from "ce/actions/aiAssistantActions";

export interface AIAssistantReduxState {
  provider?: string;
  hasApiKey: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  lastResponse?: string;
  error?: string;
}

const initialState: AIAssistantReduxState = {
  hasApiKey: false,
  isEnabled: false,
  isLoading: false,
};

export const aiAssistantReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_AI_SETTINGS]: (
    state: AIAssistantReduxState,
    action: ReduxAction<UpdateAISettingsPayload>,
  ) => {
    return {
      ...state,
      provider: action.payload.provider || state.provider,
      hasApiKey: action.payload.hasApiKey ?? state.hasApiKey,
      isEnabled: action.payload.isEnabled ?? state.isEnabled,
    };
  },
  [ReduxActionTypes.FETCH_AI_RESPONSE]: (state: AIAssistantReduxState) => {
    return {
      ...state,
      isLoading: true,
      error: undefined,
    };
  },
  [ReduxActionTypes.FETCH_AI_RESPONSE_SUCCESS]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ response: string }>,
  ) => {
    return {
      ...state,
      isLoading: false,
      lastResponse: action.payload.response,
      error: undefined,
    };
  },
  [ReduxActionTypes.FETCH_AI_RESPONSE_ERROR]: (
    state: AIAssistantReduxState,
    action: ReduxAction<{ error: string }>,
  ) => {
    return {
      ...state,
      isLoading: false,
      error: action.payload.error,
    };
  },
});
