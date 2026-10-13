import type { DefaultRootState } from "react-redux";
import type { AIMessage } from "ee/actions/aiAssistantActions";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Ask AI is CE-owned; CE cannot add an ee/ shim (pre-push architecture guard).
import type { AIEditorContext } from "ce/reducers/aiAssistantReducer";
import type { IDEType } from "ee/IDE/Interfaces/IDETypes";
import { getCurrentApplicationId } from "selectors/editorSelectors";

/** Artifact types an Ask AI request can carry. The names match the server's ArtifactType enum. */
export const AI_ARTIFACT_TYPE = {
  APPLICATION: "APPLICATION",
} as const;

/** The artifact the server authorizes an Ask AI request against when the request has no action. */
export interface AIArtifact {
  artifactId?: string;
  artifactType?: string;
}

/**
 * Returns the artifact whose editor the user is in. CE has Ask AI only in the app editor, so this is the current
 * application. EE overrides this selector for the editors it owns.
 */
export function getAIArtifact(
  state: DefaultRootState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ideType: IDEType,
): AIArtifact {
  const applicationId = getCurrentApplicationId(state);

  return applicationId
    ? { artifactId: applicationId, artifactType: AI_ARTIFACT_TYPE.APPLICATION }
    : {};
}

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

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].content;
  }

  return undefined;
}

export function getAIError(state: DefaultRootState): string | undefined {
  return state.aiAssistant.error;
}

export function getIsAIEnabled(state: DefaultRootState): boolean {
  return state.aiAssistant.isEnabled;
}

export function getIsAIConfigLoaded(state: DefaultRootState): boolean {
  return state.aiAssistant.isConfigLoaded;
}

export function getIsAIPanelOpen(state: DefaultRootState): boolean {
  return state.aiAssistant.isPanelOpen;
}

export function getAIEditorContext(
  state: DefaultRootState,
): AIEditorContext | null {
  return state.aiAssistant.editorContext;
}
