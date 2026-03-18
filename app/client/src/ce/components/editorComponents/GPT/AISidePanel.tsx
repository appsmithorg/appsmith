import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Button, Icon, Text, Tooltip } from "@appsmith/ads";
import type CodeMirror from "codemirror";
import {
  fetchAIResponse,
  clearAIResponse,
} from "ee/actions/aiAssistantActions";
import {
  getAILastResponse,
  getIsAILoading,
  getAIError,
} from "ee/selectors/aiAssistantSelectors";
import { getAIContext } from "./trigger";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  slideIn,
  PanelHeader,
  HeaderTitle,
  PanelContent,
  InputSection,
  PromptInput,
  InputActions,
  SendButton,
  QuickActionsSection,
  QuickActionsLabel,
  QuickActionsGrid,
  QuickActionChip,
  ContextSection,
  ContextLabel,
  ResponseSection,
  LoadingState,
  LoadingText,
  ErrorState,
  EmptyState,
  EmptyStateText,
  getModeLabel,
  QUICK_ACTIONS,
  AIMarkdownRenderer,
} from "./shared";

// ============================================================================
// Types
// ============================================================================

export interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  mode: TEditorModes;
  editor: CodeMirror.Editor;
}

// ============================================================================
// Panel-specific styled components
// ============================================================================

const PanelContainer = styled.div<{ isOpen: boolean }>`
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  flex-direction: column;
  width: 380px;
  min-width: 320px;
  max-width: 480px;
  height: 100%;
  background: var(--ads-v2-color-bg);
  border-left: 1px solid var(--ads-v2-color-border);
  animation: ${slideIn} 0.25s ease-out;
  position: relative;
  overflow: hidden;
`;

// ============================================================================
// Main Component
// ============================================================================

export function AISidePanel(props: AISidePanelProps) {
  const { currentValue, editor, isOpen, mode, onClose } = props;

  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState("");
  const lastResponse = useSelector(getAILastResponse);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);

  useEffect(() => {
    dispatch(clearAIResponse());
    setPrompt("");
  }, [mode, dispatch]);

  const contextInfo = useMemo(() => {
    if (!editor) return null;

    const cursorPosition = editor.getCursor();
    const context = getAIContext({
      cursorPosition,
      editor,
    });

    return {
      functionName: context.functionName,
      lineNumber: cursorPosition.line + 1,
      mode: getModeLabel(mode),
    };
  }, [editor, mode]);

  const handleSend = useCallback(() => {
    if (!prompt.trim() || !editor) return;

    const cursorPosition = editor.getCursor();
    const context = getAIContext({
      cursorPosition,
      editor,
    });

    dispatch(
      fetchAIResponse({
        prompt: prompt.trim(),
        context: {
          ...context,
          currentValue,
          mode,
        },
      }),
    );
  }, [prompt, editor, mode, currentValue, dispatch]);

  const handleQuickAction = useCallback(
    (actionPrompt: string) => {
      setPrompt(actionPrompt);

      setTimeout(() => {
        if (!editor) return;

        const cursorPosition = editor.getCursor();
        const context = getAIContext({
          cursorPosition,
          editor,
        });

        dispatch(
          fetchAIResponse({
            prompt: actionPrompt,
            context: {
              ...context,
              currentValue,
              mode,
            },
          }),
        );
      }, 100);
    },
    [editor, mode, currentValue, dispatch],
  );

  const handleClearChat = useCallback(() => {
    dispatch(clearAIResponse());
    setPrompt("");
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (!isOpen) return null;

  return (
    <PanelContainer isOpen={isOpen}>
      <PanelHeader>
        <HeaderTitle>
          <Icon className="sparkle-icon" name="sparkling-filled" size="md" />
          <Text kind="heading-xs">AI Assistant</Text>
        </HeaderTitle>
        <Tooltip content="Close (Esc)" placement="bottom">
          <Button
            isIconButton
            kind="tertiary"
            onClick={onClose}
            size="sm"
            startIcon="close-line"
          />
        </Tooltip>
      </PanelHeader>

      <PanelContent>
        <InputSection>
          <PromptInput
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to do? (Cmd+Enter to send)"
            value={prompt}
          />
          <InputActions>
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              {prompt.length > 0 && `${prompt.length} chars`}
            </Text>
            <SendButton
              isDisabled={!prompt.trim()}
              isLoading={isLoading}
              kind="primary"
              onClick={handleSend}
              size="sm"
            >
              Send
            </SendButton>
          </InputActions>
        </InputSection>

        <QuickActionsSection>
          <QuickActionsLabel>Quick Actions</QuickActionsLabel>
          <QuickActionsGrid>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionChip
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                title={action.prompt}
                type="button"
              >
                <Icon className="chip-icon" name={action.icon} size="sm" />
                {action.label}
              </QuickActionChip>
            ))}
            {(lastResponse || error) && (
              <QuickActionChip
                key="clear-chat"
                onClick={handleClearChat}
                title="Clear response"
                type="button"
              >
                <Icon className="chip-icon" name="delete-bin-line" size="sm" />
                Clear Chat
              </QuickActionChip>
            )}
          </QuickActionsGrid>
        </QuickActionsSection>

        {contextInfo && (
          <ContextSection>
            <ContextLabel>
              <Icon className="context-icon" name="eye-on" size="sm" />
              Context: <code>{contextInfo.mode}</code>
              {contextInfo.functionName && (
                <>
                  {" · "}
                  <code>{contextInfo.functionName}</code>
                </>
              )}
              {" · "}Line {contextInfo.lineNumber}
            </ContextLabel>
          </ContextSection>
        )}

        <ResponseSection>
          {isLoading && (
            <LoadingState>
              <LoadingText>
                <Icon name="loader-line" size="sm" />
                Thinking...
              </LoadingText>
            </LoadingState>
          )}

          {error && !isLoading && <ErrorState>{error}</ErrorState>}

          {!isLoading && !error && lastResponse && (
            <AIMarkdownRenderer content={lastResponse} />
          )}

          {!isLoading && !error && !lastResponse && (
            <EmptyState>
              <Icon className="empty-icon" name="ai-chat" size="lg" />
              <EmptyStateText>
                Ask me anything about your code. I can explain, fix errors,
                refactor, or help you write new functionality.
              </EmptyStateText>
            </EmptyState>
          )}
        </ResponseSection>
      </PanelContent>
    </PanelContainer>
  );
}

export default AISidePanel;
