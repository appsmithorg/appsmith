import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Button, Icon, Text, Tooltip } from "@appsmith/ads";
import type CodeMirror from "codemirror";
import {
  fetchAIResponse,
  clearAIResponse,
  type AIMessage,
} from "ee/actions/aiAssistantActions";
import {
  getAIMessages,
  getIsAILoading,
  getAIError,
} from "ee/selectors/aiAssistantSelectors";
import { getAIContext } from "./trigger";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  slideIn,
  fadeIn,
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
  ResponseContent,
  ResponseText,
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
} from "ce/components/editorComponents/GPT/shared";

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
// EE-specific styled components
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

const ChatMessages = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 95%;
  align-self: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  animation: ${fadeIn} 0.2s ease-out;
`;

const MessageHeader = styled.div<{ isUser: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ads-v2-color-fg-muted);
  ${(props) => props.isUser && "justify-content: flex-end;"}
`;

const MessageContent = styled.div<{ isUser: boolean }>`
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  ${(props) =>
    props.isUser
      ? `
    background: var(--ads-v2-color-bg-brand);
    color: white;
    border-bottom-right-radius: 4px;
  `
      : `
    background: var(--ads-v2-color-bg-subtle);
    color: var(--ads-v2-color-fg);
    border-bottom-left-radius: 4px;
  `}
`;

const ClearChatButton = styled(Button)`
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

// ============================================================================
// Main Component
// ============================================================================

export function AISidePanel(props: AISidePanelProps) {
  const { currentValue, editor, isOpen, mode, onClose } = props;

  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messages = useSelector(getAIMessages);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(clearAIResponse());
    setPrompt("");
  }, [mode, dispatch]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  const defaultLang = useMemo(() => {
    return CODE_LANGUAGES[mode] || mode || "javascript";
  }, [mode]);

  const handleClearChat = useCallback(() => {
    dispatch(clearAIResponse());
    setPrompt("");
  }, [dispatch]);

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
        <div style={{ display: "flex", gap: "4px" }}>
          {messages.length > 0 && (
            <Tooltip content="Clear chat" placement="bottom">
              <ClearChatButton
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
              onClick={onClose}
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
            placeholder="What do you want to do? (⌘+Enter to send)"
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
          {messages.length === 0 && !isLoading && !error && (
            <EmptyState>
              <Icon className="empty-icon" name="ai-chat" size="lg" />
              <EmptyStateText>
                Ask me anything about your code. I can explain, fix errors,
                refactor, or help you write new functionality.
              </EmptyStateText>
            </EmptyState>
          )}

          {messages.length > 0 && (
            <ChatMessages>
              {messages.map((message: AIMessage, msgIndex: number) => (
                <MessageBubble isUser={message.role === "user"} key={msgIndex}>
                  <MessageHeader isUser={message.role === "user"}>
                    <Icon
                      name={message.role === "user" ? "user-3-line" : "robot"}
                      size="sm"
                    />
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </MessageHeader>
                  {message.role === "user" ? (
                    <MessageContent isUser>{message.content}</MessageContent>
                  ) : (
                    <ResponseContent>
                      {extractCodeBlocks(message.content, defaultLang).map(
                        (part, partIndex) =>
                          part.type === "text" ? (
                            <ResponseText key={partIndex}>
                              {part.content}
                            </ResponseText>
                          ) : (
                            <CodeBlock key={partIndex}>
                              <CodeBlockHeader>
                                <CodeBlockLanguage>
                                  {part.language || "code"}
                                </CodeBlockLanguage>
                                <CodeBlockActions>
                                  <Tooltip
                                    content={
                                      copiedIndex === msgIndex * 100 + partIndex
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
                                          msgIndex * 100 + partIndex,
                                        )
                                      }
                                      size="sm"
                                      startIcon={
                                        copiedIndex ===
                                        msgIndex * 100 + partIndex
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
                    </ResponseContent>
                  )}
                </MessageBubble>
              ))}
              <div ref={messagesEndRef} />
            </ChatMessages>
          )}

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

export default AISidePanel;
