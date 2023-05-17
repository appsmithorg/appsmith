import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";

export type TAIWrapperProps = {
  children?: React.ReactNode;
  isOpen?: boolean;
  currentValue: string;
  close: () => void;
  update?: (...args: any) => void;
  triggerContext?: CodeEditorExpected;
  enableAIAssistance: boolean;
  dataTreePath?: string;
  mode: TEditorModes;
};

export function AIWindow(props: TAIWrapperProps) {
  const { children } = props;
  //eslint-disable-next-line
  return <>{children}</>;
}
