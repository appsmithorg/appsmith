import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type {
  FieldEntityInformation,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import React from "react";
import type CodeMirror from "codemirror";

export type AIEditorContext = Partial<{
  functionName: string;
  cursorLineNumber: number;
  functionString: string;
  cursorPosition: CodeMirror.Position;
  cursorCoordinates: {
    left: number;
    top: number;
    bottom: number;
  };
  mode: string;
}>;

export interface TAIWrapperProps {
  children?: React.ReactNode;
  isOpen: boolean;
  currentValue: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update?: (...args: any) => void;
  triggerContext?: CodeEditorExpected;
  enableAIAssistance: boolean;
  dataTreePath?: string;
  mode: TEditorModes;
  entity: FieldEntityInformation;
  entitiesForNavigation: EntityNavigationData;
  editor: CodeMirror.Editor;
  onOpenChanged: (isOpen: boolean) => void;
}

export function AIWindow(props: TAIWrapperProps) {
  const { children } = props;
  //eslint-disable-next-line
  return <>{children}</>;
}
