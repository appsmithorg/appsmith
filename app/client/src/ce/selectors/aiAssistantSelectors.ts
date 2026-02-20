import type { DefaultRootState } from "react-redux";
import type { AIMessage } from "ee/actions/aiAssistantActions";
import type { AIEditorContext } from "ee/reducers/aiAssistantReducer";

export function getAIAssistantState(state: DefaultRootState) {
  return state.aiAssistant;
}

export function getHasAIApiKey(state: DefaultRootState): boolean {
  return state.aiAssistant.hasApiKey;
}

export function getAIProvider(state: DefaultRootState): string | undefined {
  return state.aiAssistant.provider;
}

export function getIsAILoading(state: DefaultRootState): boolean {
  return state.aiAssistant.isLoading;
}

export function getAIMessages(state: DefaultRootState): AIMessage[] {
  return state.aiAssistant.messages || [];
}

/** @deprecated Use getAIMessages instead */
export function getAILastResponse(state: DefaultRootState): string | undefined {
  const messages = state.aiAssistant.messages || [];

  return messages.findLast((m) => m.role === "assistant")?.content;
}

export function getAIError(state: DefaultRootState): string | undefined {
  return state.aiAssistant.error;
}

export function getIsAIEnabled(state: DefaultRootState): boolean {
  return state.aiAssistant.isEnabled;
}

export function getIsAIPanelOpen(state: DefaultRootState): boolean {
  return state.aiAssistant.isPanelOpen;
}

export function getAIEditorContext(
  state: DefaultRootState,
): AIEditorContext | null {
  return state.aiAssistant.editorContext;
}
