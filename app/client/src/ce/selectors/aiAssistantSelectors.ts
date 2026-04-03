import type { DefaultRootState } from "react-redux";

export function getAIAssistantState(state: DefaultRootState) {
  return undefined;
}

export function getHasAIApiKey(_state: DefaultRootState): boolean {
  return false;
}

export function getAIProvider(_state: DefaultRootState): string | undefined {
  return undefined;
}

export function getIsAILoading(_state: DefaultRootState): boolean {
  return false;
}

export function getAIMessages(_state: DefaultRootState): never[] {
  return [];
}

export function getAILastResponse(
  _state: DefaultRootState,
): string | undefined {
  return undefined;
}

export function getAIError(_state: DefaultRootState): string | undefined {
  return undefined;
}

export function getIsAIEnabled(_state: DefaultRootState): boolean {
  return false;
}

export function getIsAIConfigLoaded(_state: DefaultRootState): boolean {
  return false;
}

export function getIsAIPanelOpen(_state: DefaultRootState): boolean {
  return false;
}

export function getAIEditorContext(_state: DefaultRootState): null {
  return null;
}
