import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type {
  FieldEntityInformation,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { EntityNavigationData } from "entities/DataTree/dataTreeTypes";
import React from "react";
import type CodeMirror from "codemirror";
import styled from "styled-components";
import { AISidePanel } from "./AISidePanel";

// Re-export the new components
export { AISidePanel } from "./AISidePanel";

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
  update?: (value: string) => void;
  triggerContext?: CodeEditorExpected;
  enableAIAssistance: boolean;
  dataTreePath?: string;
  mode: TEditorModes;
  entity: FieldEntityInformation;
  entitiesForNavigation: EntityNavigationData;
  editor: CodeMirror.Editor;
  onOpenChanged: (isOpen: boolean) => void;
}

// ============================================================================
// Styled Components - Side Panel Layout
// ============================================================================

const LayoutContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
`;

const EditorSection = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
`;

// ============================================================================
// AIWindow Component - Now uses side panel layout
// ============================================================================

export function AIWindow(props: TAIWrapperProps) {
  const {
    children,
    currentValue,
    editor,
    enableAIAssistance,
    isOpen,
    mode,
    onOpenChanged,
  } = props;

  if (!enableAIAssistance) {
    return children as React.ReactElement;
  }

  return (
    <LayoutContainer>
      <EditorSection>{children}</EditorSection>

      {editor && (
        <AISidePanel
          currentValue={currentValue}
          editor={editor}
          isOpen={isOpen}
          mode={mode}
          onClose={() => onOpenChanged(false)}
        />
      )}
    </LayoutContainer>
  );
}
