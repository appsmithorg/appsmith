import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import type FeatureFlags from "entities/FeatureFlags";
export const APPSMITH_AI = "AI";

/* eslint-disable-next-line */
export function isAIEnabled(ff: FeatureFlags, modes: TEditorModes) {
  return false;
}

export function GPTTrigger() {
  return null;
}
