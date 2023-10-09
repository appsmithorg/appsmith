export * from "ce/components/editorComponents/GPT/AskAIButton";

import React, { useEffect } from "react";
import { Button } from "design-system";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import type {
  FieldEntityInformation,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { GPTTask } from "./utils";

type AskAIButtonProps = {
  mode: TEditorModes;
  onClick: () => void;
  entity: FieldEntityInformation;
};

export function AskAIButton(props: AskAIButtonProps) {
  const { entity, mode, onClick } = props;
  const askAIButtonFeatureFlagEnabled = useFeatureFlag(
    "ab_ai_button_sql_enabled",
  );
  const askAISQLFeatureFlagEnabled = useFeatureFlag("ask_ai_sql");

  // Show ask ai button if the a/b tesing feature flag is enabled
  const showAskAIButton =
    mode === EditorModes.POSTGRESQL_WITH_BINDING &&
    askAISQLFeatureFlagEnabled &&
    askAIButtonFeatureFlagEnabled;

  useEffect(() => {
    if (showAskAIButton) {
      AnalyticsUtil.logEvent("AI_ASK_AI_BUTTON_SHOWN", {
        type: GPTTask.SQL_QUERY,
        entityId: entity.entityId,
        entityName: entity.entityName,
      });
    }
  }, [showAskAIButton]);

  if (!showAskAIButton) {
    return null;
  }

  const handleClick = () => {
    onClick();
    AnalyticsUtil.logEvent("AI_ASK_AI_BUTTON_CLICK", {
      type: GPTTask.SQL_QUERY,
      entityId: entity.entityId,
      entityName: entity.entityName,
    });
  };

  return (
    <Button kind="tertiary" onClick={handleClick} startIcon="magic-line">
      Use AI
    </Button>
  );
}
