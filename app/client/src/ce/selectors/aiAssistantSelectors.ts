import type { DefaultRootState } from "react-redux";

export const getAIAssistantState = (state: DefaultRootState) =>
  state.aiAssistant;

export const getHasAIApiKey = (state: DefaultRootState) =>
  state.aiAssistant.hasApiKey;

export const getAIProvider = (state: DefaultRootState) =>
  state.aiAssistant.provider;

export const getIsAILoading = (state: DefaultRootState) =>
  state.aiAssistant.isLoading;

export const getAILastResponse = (state: DefaultRootState) =>
  state.aiAssistant.lastResponse;

export const getAIError = (state: DefaultRootState) => state.aiAssistant.error;

export const getIsAIEnabled = (state: DefaultRootState) =>
  state.aiAssistant.isEnabled;
