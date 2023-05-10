import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import React from "react";

export type TAIWrapperProps = {
  children?: React.ReactNode;
  isOpen?: boolean;
  currentValue: string;
  close: () => void;
  update?: (...args: any) => void;
  triggerContext?: CodeEditorExpected;
  enableAIAssistance: boolean;
};

export function AIWindow(props: TAIWrapperProps) {
  const { children } = props;
  //eslint-disable-next-line
  return <>{children}</>;
}
