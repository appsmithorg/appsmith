import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Button, Icon, Text, Tooltip } from "@appsmith/ads";
import {
  fetchAIResponse,
  clearAIResponse,
  closeAIPanel,
} from "ee/actions/aiAssistantActions";
import {
  getIsAILoading,
  getAIError,
  getIsAIPanelOpen,
  getAIEditorContext,
  getAIMessages,
} from "ee/selectors/aiAssistantSelectors";

// ============================================================================
// Types
// ============================================================================

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
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  overflow: hidden;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
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
  max-height: 200px;
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

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--ads-v2-color-border);
    border-radius: 4px;

    &:hover {
      background: var(--ads-v2-color-border-emphasis);
    }
  }
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  padding: 12px 16px;
  border-radius: 12px;
  background: ${(props) =>
    props.isUser ? "var(--ads-v2-color-bg-subtle)" : "var(--ads-v2-color-bg)"};
  border: 1px solid var(--ads-v2-color-border);
  animation: ${fadeIn} 0.2s ease-out;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MessageContent = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: var(--ads-v2-color-fg);
  white-space: pre-wrap;
  word-break: break-word;
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
  min-height: 60px;
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

const ClearButton = styled(Button)`
  margin-left: 8px;
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
  defaultLanguage: string = "javascript",
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
      language: match[1] || defaultLanguage,
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

function getModeLabel(mode: string | undefined): string {
  if (!mode) return "Code";

  const modeMap: Record<string, string> = {
    javascript: "JavaScript",
    "text/x-sql": "SQL",
    sql: "SQL",
    "text/x-pgsql": "PostgreSQL",
    "text/x-mysql": "MySQL",
    graphql: "GraphQL",
    json: "JSON",
    "application/json": "JSON",
  };

  return modeMap[mode] || mode;
}

// ============================================================================
// Main Component
// ============================================================================

export function GlobalAISidePanel() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [prompt, setPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(location.pathname);

  const isOpen = useSelector(getIsAIPanelOpen);
  const editorContext = useSelector(getAIEditorContext);
  const messages = useSelector(getAIMessages);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);

  // Track previous context to detect changes
  const previousContextRef = useRef<{
    mode?: string;
    entityName?: string;
  } | null>(null);

  // Clear messages when editor context changes (e.g., switching from JS to SQL)
  useEffect(() => {
    const prevContext = previousContextRef.current;
    const currentMode = editorContext?.mode;
    const currentEntityName = editorContext?.entityName;

    // Only clear if we had a previous context and it changed
    if (
      prevContext &&
      (prevContext.mode !== currentMode ||
        prevContext.entityName !== currentEntityName)
    ) {
      dispatch(clearAIResponse());
    }

    // Update the ref with current context
    previousContextRef.current = {
      mode: currentMode,
      entityName: currentEntityName,
    };
  }, [editorContext?.mode, editorContext?.entityName, dispatch]);

  // Close panel when navigating to a different route
  useEffect(() => {
    if (previousPathRef.current !== location.pathname && isOpen) {
      dispatch(closeAIPanel());
    }

    previousPathRef.current = location.pathname;
  }, [location.pathname, isOpen, dispatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (responseRef.current && messages.length > 0) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = useCallback(() => {
    dispatch(closeAIPanel());
  }, [dispatch]);

  const handleSend = useCallback(() => {
    if (!prompt.trim()) return;

    dispatch(
      fetchAIResponse({
        prompt: prompt.trim(),
        context: editorContext || undefined,
      }),
    );
    setPrompt("");
  }, [prompt, editorContext, dispatch]);

  const handleQuickAction = useCallback(
    (actionPrompt: string) => {
      dispatch(
        fetchAIResponse({
          prompt: actionPrompt,
          context: editorContext || undefined,
        }),
      );
    },
    [editorContext, dispatch],
  );

  const handleCopyCode = useCallback(async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleClearChat = useCallback(() => {
    dispatch(clearAIResponse());
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }

      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleSend, handleClose],
  );

  const contextInfo = useMemo(() => {
    if (!editorContext) return null;

    return {
      mode: getModeLabel(editorContext.mode),
      entityName: editorContext.entityName,
      propertyPath: editorContext.propertyPath,
      lineNumber: editorContext.cursorLineNumber,
    };
  }, [editorContext]);

  // Get language for code blocks based on editor mode
  const defaultLanguage = useMemo(() => {
    const mode = editorContext?.mode || "";
    const languageMap: Record<string, string> = {
      javascript: "javascript",
      "text/x-sql": "sql",
      sql: "sql",
      "text/x-pgsql": "sql",
      "text/x-mysql": "sql",
      graphql: "graphql",
      "application/json": "json",
      json: "json",
    };

    return languageMap[mode] || mode || "javascript";
  }, [editorContext?.mode]);

  if (!isOpen) return null;

  return (
    <PanelContainer isOpen={isOpen}>
      <PanelHeader>
        <HeaderTitle>
          <Icon className="sparkle-icon" name="sparkling-filled" size="md" />
          <Text kind="heading-xs">AI Assistant</Text>
        </HeaderTitle>
        <div style={{ display: "flex", alignItems: "center" }}>
          {messages.length > 0 && (
            <Tooltip content="Clear chat" placement="bottom">
              <ClearButton
                isIconButton
                kind="tertiary"
                onClick={handleClearChat}
                size="sm"
                startIcon="delete-bin-line"
              />
            </Tooltip>
          )}
          <Tooltip content="Close (Esc)" placement="bottom">
            <Button
              isIconButton
              kind="tertiary"
              onClick={handleClose}
              size="sm"
              startIcon="close-line"
            />
          </Tooltip>
        </div>
      </PanelHeader>

      <PanelContent>
        <InputSection>
          <PromptInput
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like help with? (Cmd+Enter to send)"
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
              {contextInfo.entityName && (
                <>
                  {" > "}
                  <code>{contextInfo.entityName}</code>
                </>
              )}
              {contextInfo.propertyPath && (
                <>
                  {" > "}
                  <code>{contextInfo.propertyPath}</code>
                </>
              )}
              {contextInfo.lineNumber !== undefined && (
                <> at line {contextInfo.lineNumber + 1}</>
              )}
            </ContextLabel>
          </ContextSection>
        )}

        <ResponseSection ref={responseRef}>
          {messages.length === 0 && !isLoading && !error && (
            <EmptyState>
              <Icon className="empty-icon" name="wand" size="lg" />
              <EmptyStateText>
                Ask me anything about your code. I can explain, fix errors,
                refactor, or help you write new functionality.
              </EmptyStateText>
            </EmptyState>
          )}

          <MessageList>
            {messages.map((message, idx) => {
              const parts =
                message.role === "assistant"
                  ? extractCodeBlocks(message.content, defaultLanguage)
                  : [{ type: "text" as const, content: message.content }];

              return (
                <MessageBubble isUser={message.role === "user"} key={idx}>
                  <MessageHeader>
                    <Icon
                      name={message.role === "user" ? "user-3-line" : "robot"}
                      size="sm"
                    />
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </MessageHeader>
                  <MessageContent>
                    {parts.map((part, partIdx) =>
                      part.type === "text" ? (
                        <span key={partIdx}>{part.content}</span>
                      ) : (
                        <CodeBlock key={partIdx}>
                          <CodeBlockHeader>
                            <CodeBlockLanguage>
                              {part.language || "code"}
                            </CodeBlockLanguage>
                            <CodeBlockActions>
                              <Tooltip
                                content={
                                  copiedIndex === idx * 100 + partIdx
                                    ? "Copied!"
                                    : "Copy"
                                }
                                placement="top"
                              >
                                <Button
                                  isIconButton
                                  kind="tertiary"
                                  onClick={() =>
                                    void handleCopyCode(
                                      part.content,
                                      idx * 100 + partIdx,
                                    )
                                  }
                                  size="sm"
                                  startIcon={
                                    copiedIndex === idx * 100 + partIdx
                                      ? "check-line"
                                      : "copy-control"
                                  }
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
                  </MessageContent>
                </MessageBubble>
              );
            })}
          </MessageList>

          {isLoading && (
            <LoadingState>
              <LoadingText>
                <Icon name="loader-line" size="sm" />
                Thinking...
              </LoadingText>
            </LoadingState>
          )}

          {error && !isLoading && <ErrorState>{error}</ErrorState>}
        </ResponseSection>
      </PanelContent>
    </PanelContainer>
  );
}

export default GlobalAISidePanel;
