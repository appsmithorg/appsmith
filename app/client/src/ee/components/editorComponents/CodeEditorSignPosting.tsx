export * from "ce/components/editorComponents/CodeEditorSignPosting";

import BindingPrompt from "components/editorComponents/CodeEditor/BindingPrompt";
import type {
  EditorTheme,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";
import { useSelector } from "react-redux";
import AISignPosting from "./AiSignPosting";

export function CodeEditorSignPosting(props: {
  promptMessage?: React.ReactNode | string;
  isOpen?: boolean;
  editorTheme?: EditorTheme;
  showLightningMenu?: boolean;
  isAIEnabled: boolean;
  mode: TEditorModes;
  forComp?: string;
}): JSX.Element {
  const noOfTimesAITriggered = useSelector(
    (state) => state.ai.noOfTimesAITriggered,
  );

  const canShowSignPosting = noOfTimesAITriggered < 5 && props.isAIEnabled;

  if (canShowSignPosting) {
    return (
      <AISignPosting
        forComp={props.forComp}
        isOpen={props.isOpen}
        mode={props.mode}
      />
    );
  }

  return (
    <BindingPrompt
      editorTheme={props.editorTheme}
      isAIEnabled={props.isAIEnabled}
      isOpen={props.isOpen || false}
      promptMessage={props.promptMessage}
      showLightningMenu={props.showLightningMenu}
    />
  );
}
