import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
export const APPSMITH_AI = "Appsmith AI";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";

/* eslint-disable-next-line */
export function isAIEnabled(ff: FeatureFlags, mode: TEditorModes) {
  return false;
}
