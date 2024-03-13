import BindingPrompt from "components/editorComponents/CodeEditor/BindingPrompt";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { TEditorModes } from "components/editorComponents/CodeEditor/sql/config";
import React from "react";

export function CodeEditorSignPosting(props: {
  promptMessage?: React.ReactNode | string;
  isOpen?: boolean;
  editorTheme?: EditorTheme;
  showLightningMenu?: boolean;
  mode: TEditorModes;
  forComp?: string;
}): JSX.Element {
  return (
    <BindingPrompt
      editorTheme={props.editorTheme}
      isOpen={props.isOpen || false}
      promptMessage={props.promptMessage}
      showLightningMenu={props.showLightningMenu}
    />
  );
}
