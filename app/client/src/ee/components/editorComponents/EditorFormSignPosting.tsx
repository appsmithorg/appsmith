export * from "ce/components/editorComponents/EditorFormSignPosting";
import React from "react";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { useSelector } from "react-redux";
import AISignPosting from "./AiSignPosting";

export type Props = {
  isAIEnabled: boolean;
  mode: TEditorModes;
};

export function EditorFormSignPosting(props: Props) {
  const noOfTimesAITriggered = useSelector(
    (state) => state.ai.noOfTimesAITriggeredForQuery,
  );

  const canShowSignPosting = noOfTimesAITriggered < 5 && props.isAIEnabled;

  if (!canShowSignPosting) {
    return null;
  }

  return <AISignPosting isOpen mode={props.mode} />;
}
