import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
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
import {
  slideIn,
  fadeIn,
  PanelHeader,
  HeaderTitle,
  PanelContent,
  InputSection,
  InputActions,
  SendButton,
  QuickActionsSection,
  QuickActionsLabel,
  QuickActionsGrid,
  QuickActionChip,
  ContextSection,
  ContextLabel,
  LoadingState,
  LoadingText,
  ErrorState,
  CodeBlock,
  CodeBlockHeader,
  CodeBlockLanguage,
  CodeBlockActions,
  CodeBlockContent,
  EmptyState,
  EmptyStateText,
  extractCodeBlocks,
  getModeLabel,
  CODE_LANGUAGES,
  QUICK_ACTIONS,
} from "ee/components/editorComponents/GPT/shared";

// ============================================================================
// GlobalAISidePanel-specific styled components
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

const ClearButton = styled(Button)`
  margin-left: 8px;
`;

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

  const previousContextRef = useRef<{
    mode?: string;
    entityName?: string;
  } | null>(null);

  useEffect(() => {
    const prevContext = previousContextRef.current;
    const currentMode = editorContext?.mode;
    const currentEntityName = editorContext?.entityName;

    if (
      prevContext &&
      (prevContext.mode !== currentMode ||
        prevContext.entityName !== currentEntityName)
    ) {
      dispatch(clearAIResponse());
    }

    previousContextRef.current = {
      mode: currentMode,
      entityName: currentEntityName,
    };
  }, [editorContext?.mode, editorContext?.entityName, dispatch]);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname && isOpen) {
      dispatch(closeAIPanel());
    }

    previousPathRef.current = location.pathname;
  }, [location.pathname, isOpen, dispatch]);

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

  const defaultLanguage = useMemo(() => {
    const mode = editorContext?.mode || "";

    return CODE_LANGUAGES[mode] || mode || "javascript";
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
            {messages.length > 0 && (
              <QuickActionChip
                key="clear-chat"
                onClick={handleClearChat}
                title="Clear all chat messages"
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
