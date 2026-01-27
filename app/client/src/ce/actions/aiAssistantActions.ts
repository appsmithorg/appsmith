import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export interface UpdateAISettingsPayload {
  provider?: string;
  hasApiKey?: boolean;
  isEnabled?: boolean;
}

export const updateAISettings = (
  payload: UpdateAISettingsPayload,
): ReduxAction<UpdateAISettingsPayload> => ({
  type: ReduxActionTypes.UPDATE_AI_SETTINGS,
  payload,
});

export interface FetchAIResponsePayload {
  prompt: string;
  context: {
    functionName?: string;
    cursorLineNumber?: number;
    functionString?: string;
    mode: string;
    currentValue: string;
  };
}

export const fetchAIResponse = (
  payload: FetchAIResponsePayload,
): ReduxAction<FetchAIResponsePayload> => ({
  type: ReduxActionTypes.FETCH_AI_RESPONSE,
  payload,
});

export const fetchAIResponseSuccess = (payload: {
  response: string;
}): ReduxAction<{ response: string }> => ({
  type: ReduxActionTypes.FETCH_AI_RESPONSE_SUCCESS,
  payload,
});

export const fetchAIResponseError = (payload: {
  error: string;
}): ReduxAction<{ error: string }> => ({
  type: ReduxActionTypes.FETCH_AI_RESPONSE_ERROR,
  payload,
});
