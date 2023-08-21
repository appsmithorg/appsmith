export * from "ce/components/editorComponents/GPT/trigger";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import {
  EditorModes,
  type TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { editorSQLModes } from "components/editorComponents/CodeEditor/sql/config";
export const APPSMITH_AI = "Appsmith AI";

export function isAIEnabled(ff: FeatureFlags, mode: TEditorModes) {
  let featureFlagValue = ff.ask_ai;
  if (mode === editorSQLModes.POSTGRESQL_WITH_BINDING) {
    featureFlagValue = ff.ask_ai_sql;
  } else if (mode === EditorModes.JAVASCRIPT) {
    featureFlagValue = ff.ask_ai_js;
  }
  return featureFlagValue;
}
