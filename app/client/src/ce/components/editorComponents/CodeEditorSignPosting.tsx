import BindingPrompt from "components/editorComponents/CodeEditor/BindingPrompt";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";

export function CodeEditorSignPosting(props: {
  promptMessage?: React.ReactNode | string;
  isOpen: boolean;
  editorTheme?: EditorTheme;
  showLightningMenu?: boolean;
  isAIEnabled?: boolean;
}): JSX.Element {
  return (
    <BindingPrompt
      editorTheme={props.editorTheme}
      isAIEnabled={props.isAIEnabled}
      isOpen={props.isOpen}
      promptMessage={props.promptMessage}
      showLightningMenu={props.showLightningMenu}
    />
  );
}
