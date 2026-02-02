import React, { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import { Button, Icon, Text, Tooltip } from "@appsmith/ads";
import type CodeMirror from "codemirror";
import { fetchAIResponse } from "ee/actions/aiAssistantActions";
import {
  getAILastResponse,
  getIsAILoading,
  getAIError,
} from "ee/selectors/aiAssistantSelectors";
import { getAIContext } from "./trigger";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

// ============================================================================
// Types
// ============================================================================

export interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  mode: TEditorModes;
  editor: CodeMirror.Editor;
  onApplyCode: (code: string) => void;
}

interface QuickAction {
  label: string;
  icon: string;
  prompt: string;
}

// ============================================================================
// Animations
// ============================================================================

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ============================================================================
// Styled Components
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

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(
    180deg,
    var(--ads-v2-color-bg) 0%,
    var(--ads-v2-color-bg-subtle) 100%
  );
  border-bottom: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .sparkle-icon {
    color: var(--ads-v2-color-fg-brand);
  }
`;

const PanelContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const InputSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
  flex-shrink: 0;
`;

const PromptInput = styled.textarea`
  width: 100%;
  min-height: 72px;
  max-height: 160px;
  padding: 12px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 8px;
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--ads-v2-color-border-emphasis);
    box-shadow: 0 0 0 3px var(--ads-v2-color-bg-brand-secondary);
  }

  &::placeholder {
    color: var(--ads-v2-color-fg-muted);
  }
`;

const InputActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

const SendButton = styled(Button)`
  min-width: 80px;
`;

const QuickActionsSection = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg-subtle);
  flex-shrink: 0;
`;

const QuickActionsLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const QuickActionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const QuickActionChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 6px;
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--ads-v2-color-bg-emphasis);
    border-color: var(--ads-v2-color-border-emphasis);
  }

  &:active {
    transform: scale(0.98);
  }

  .chip-icon {
    font-size: 14px;
    color: var(--ads-v2-color-fg-muted);
  }
`;

const ContextSection = styled.div`
  padding: 10px 16px;
  background: var(--ads-v2-color-bg-muted);
  border-bottom: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
`;

const ContextLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ads-v2-color-fg-muted);

  .context-icon {
    font-size: 12px;
  }

  code {
    background: var(--ads-v2-color-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    color: var(--ads-v2-color-fg);
  }
`;

const ResponseSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const LoadingState = styled.div`
  padding: 16px;
  background: linear-gradient(
    90deg,
    var(--ads-v2-color-bg-subtle) 25%,
    var(--ads-v2-color-bg-muted) 50%,
    var(--ads-v2-color-bg-subtle) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
  min-height: 80px;
`;

const LoadingText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ads-v2-color-fg-muted);
  font-size: 13px;
`;

const ErrorState = styled.div`
  padding: 12px 16px;
  background: var(--ads-v2-color-bg-error);
  border: 1px solid var(--ads-v2-color-border-error);
  border-radius: 8px;
  color: var(--ads-v2-color-fg-error);
  font-size: 13px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ResponseContent = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

const ResponseText = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: var(--ads-v2-color-fg);
  white-space: pre-wrap;

  p {
    margin: 0 0 12px 0;
  }
`;

const CodeBlock = styled.div`
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--ads-v2-color-border);
`;

const CodeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--ads-v2-color-bg-subtle);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const CodeBlockLanguage = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
`;

const CodeBlockActions = styled.div`
  display: flex;
  gap: 4px;
`;

const CodeBlockContent = styled.pre`
  margin: 0;
  padding: 12px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 32px;
  color: var(--ads-v2-color-fg-muted);

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: 16px;
  }
`;

const EmptyStateText = styled.div`
  font-size: 13px;
  line-height: 1.5;
  max-width: 240px;
`;

// ============================================================================
// Quick Actions Configuration
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Explain",
    icon: "question-line",
    prompt: "Explain what this code does step by step",
  },
  {
    label: "Fix Errors",
    icon: "bug-line",
    prompt: "Find and fix any bugs or errors in this code",
  },
  {
    label: "Refactor",
    icon: "magic-line",
    prompt: "Refactor this code to be cleaner and more efficient",
  },
  {
    label: "Add Comments",
    icon: "pencil-line",
    prompt: "Add helpful comments to explain this code",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function extractCodeBlocks(
  text: string,
): Array<{ type: "text" | "code"; content: string; language?: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: Array<{
    type: "text" | "code";
    content: string;
    language?: string;
  }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();

      if (textContent) {
        parts.push({ type: "text", content: textContent });
      }
    }

    parts.push({
      type: "code",
      content: match[2].trim(),
      language: match[1] || "javascript",
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex).trim();

    if (textContent) {
      parts.push({ type: "text", content: textContent });
    }
  }

  if (parts.length === 0 && text.trim()) {
    parts.push({ type: "text", content: text.trim() });
  }

  return parts;
}

function getModeLabel(mode: string): string {
  const modeMap: Record<string, string> = {
    javascript: "JavaScript",
    "text/x-sql": "SQL",
    sql: "SQL",
    "text/x-pgsql": "PostgreSQL",
    "text/x-mysql": "MySQL",
    graphql: "GraphQL",
    json: "JSON",
  };

  return modeMap[mode] || mode;
}

// ============================================================================
// Main Component
// ============================================================================

export function AISidePanel(props: AISidePanelProps) {
  const { currentValue, editor, isOpen, mode, onApplyCode, onClose } = props;

  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const lastResponse = useSelector(getAILastResponse);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);

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

  const responseParts = useMemo(() => {
    if (!lastResponse) return [];

    return extractCodeBlocks(lastResponse);
  }, [lastResponse]);

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

  const handleCopyCode = useCallback(async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleInsertCode = useCallback(
    (code: string) => {
      onApplyCode(code);
    },
    [onApplyCode],
  );

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

          {!isLoading && !error && responseParts.length > 0 && (
            <ResponseContent>
              {responseParts.map((part, index) =>
                part.type === "text" ? (
                  <ResponseText key={index}>{part.content}</ResponseText>
                ) : (
                  <CodeBlock key={index}>
                    <CodeBlockHeader>
                      <CodeBlockLanguage>
                        {part.language || "code"}
                      </CodeBlockLanguage>
                      <CodeBlockActions>
                        <Tooltip
                          content={copiedIndex === index ? "Copied!" : "Copy"}
                          placement="top"
                        >
                          <Button
                            isIconButton
                            kind="tertiary"
                            onClick={() =>
                              void handleCopyCode(part.content, index)
                            }
                            size="sm"
                            startIcon={
                              copiedIndex === index
                                ? "check-line"
                                : "copy-control"
                            }
                          />
                        </Tooltip>
                        <Tooltip content="Insert at cursor" placement="top">
                          <Button
                            isIconButton
                            kind="tertiary"
                            onClick={() => handleInsertCode(part.content)}
                            size="sm"
                            startIcon="download-line"
                          />
                        </Tooltip>
                        <Tooltip content="Replace selection" placement="top">
                          <Button
                            isIconButton
                            kind="tertiary"
                            onClick={() => handleInsertCode(part.content)}
                            size="sm"
                            startIcon="restart-line"
                          />
                        </Tooltip>
                      </CodeBlockActions>
                    </CodeBlockHeader>
                    <CodeBlockContent>
                      <code>{part.content}</code>
                    </CodeBlockContent>
                  </CodeBlock>
                ),
              )}
            </ResponseContent>
          )}

          {!isLoading && !error && responseParts.length === 0 && (
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
