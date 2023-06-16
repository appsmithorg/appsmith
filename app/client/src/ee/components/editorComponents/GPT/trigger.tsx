export * from "ce/components/editorComponents/GPT/trigger";

import type FeatureFlags from "entities/FeatureFlags";
import {
  EditorModes,
  type TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { getAppsmithConfigs } from "@appsmith/configs";
import { editorSQLModes } from "components/editorComponents/CodeEditor/sql/config";
const { cloudHosting } = getAppsmithConfigs();
export const APPSMITH_AI = "AI";

export function isAIEnabled(ff: FeatureFlags, mode: TEditorModes) {
  let featureFlagValue = ff.ask_ai;
  if (mode === editorSQLModes.POSTGRESQL_WITH_BINDING) {
    featureFlagValue = ff.ask_ai_sql;
  } else if (mode === EditorModes.JAVASCRIPT) {
    featureFlagValue = ff.ask_ai_js;
  }
  return Boolean(cloudHosting && featureFlagValue);
}
