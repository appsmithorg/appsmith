export * from "ce/components/editorComponents/GPT/trigger";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import {
  isAskAIEnabled,
  isAskAIJSEnabled,
  isAskAISQLEnabled,
} from "@appsmith/utils/planHelpers";
import {
  EditorModes,
  type TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { editorSQLModes } from "components/editorComponents/CodeEditor/sql/config";
export const APPSMITH_AI = "Appsmith AI";

export function isAIEnabled(featureFlags: FeatureFlags, mode: TEditorModes) {
  let featureFlagValue: boolean = isAskAIEnabled(featureFlags);
  if (mode === editorSQLModes.POSTGRESQL_WITH_BINDING) {
    featureFlagValue = isAskAISQLEnabled(featureFlags);
  } else if (mode === EditorModes.JAVASCRIPT) {
    featureFlagValue = isAskAIJSEnabled(featureFlags);
  }
  return featureFlagValue;
}
