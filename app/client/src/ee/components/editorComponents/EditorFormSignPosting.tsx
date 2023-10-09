export * from "ce/components/editorComponents/EditorFormSignPosting";
import React from "react";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { useSelector } from "react-redux";
import AISignPosting from "./AiSignPosting";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

export type Props = {
  isAIEnabled: boolean;
  mode: TEditorModes;
};

export function EditorFormSignPosting(props: Props) {
  const noOfTimesAITriggered = useSelector(
    (state) => state.ai.noOfTimesAITriggeredForQuery,
  );
  const askAIButtonFeatureFlagEnabled = useFeatureFlag(
    "ab_ai_button_sql_enabled",
  );
  const showSignPosting =
    noOfTimesAITriggered < 5 &&
    props.isAIEnabled &&
    !askAIButtonFeatureFlagEnabled;

  if (!showSignPosting) {
    return null;
  }

  return <AISignPosting isOpen mode={props.mode} />;
}
