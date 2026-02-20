import React from "react";
import styled from "styled-components";
import type CodeMirror from "codemirror";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { AISidePanel } from "./AISidePanel";

// ============================================================================
// Types
// ============================================================================

export interface AIEditorLayoutProps {
  children: React.ReactNode;
  isAIPanelOpen: boolean;
  onAIPanelClose: () => void;
  currentValue: string;
  mode: TEditorModes;
  editor: CodeMirror.Editor;
  onApplyCode: (code: string) => void;
  enableAIAssistance: boolean;
}

// ============================================================================
// Styled Components
// ============================================================================

const LayoutContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
`;

const EditorSection = styled.div<{ hasSidePanel: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
  transition: flex 0.25s ease-out;
`;

// ============================================================================
// Main Component
// ============================================================================

export function AIEditorLayout(props: AIEditorLayoutProps) {
  const {
    children,
    currentValue,
    editor,
    enableAIAssistance,
    isAIPanelOpen,
    mode,
    onAIPanelClose,
    onApplyCode,
  } = props;

  // If AI assistance is not enabled, just render children
  if (!enableAIAssistance) {
    return children as React.ReactElement;
  }

  return (
    <LayoutContainer>
      <EditorSection hasSidePanel={isAIPanelOpen}>{children}</EditorSection>

      {editor && (
        <AISidePanel
          currentValue={currentValue}
          editor={editor}
          isOpen={isAIPanelOpen}
          mode={mode}
          onApplyCode={onApplyCode}
          onClose={onAIPanelClose}
        />
      )}
    </LayoutContainer>
  );
}

export default AIEditorLayout;
