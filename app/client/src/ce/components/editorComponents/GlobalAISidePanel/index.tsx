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
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Ask AI is CE-owned; CE cannot add an ee/ shim (pre-push architecture guard).
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
  ResponseSection,
  LoadingState,
  LoadingText,
  ErrorState,
  EmptyState,
  EmptyStateText,
  getModeLabel,
  QUICK_ACTIONS,
  AIMarkdownRenderer,
  ResizeHandle,
} from "ce/components/editorComponents/GPT/shared";

const PANEL_DEFAULT_WIDTH = 380;
const PANEL_MIN_WIDTH = 320;
const PANEL_MAX_WIDTH = 720;

const PanelContainer = styled.div<{ isOpen: boolean; width: number }>`
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  flex-direction: column;
  width: ${(props) => props.width}px;
  min-width: ${PANEL_MIN_WIDTH}px;
  max-width: ${PANEL_MAX_WIDTH}px;
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

export function GlobalAISidePanel() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [prompt, setPrompt] = useState("");
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);
  const responseRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(location.pathname);
  const isDraggingRef = useRef(false);

  const isOpen = useSelector(getIsAIPanelOpen);
  const editorContext = useSelector(getAIEditorContext);
  const messages = useSelector(getAIMessages);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);

  const previousContextRef = useRef<{
    mode?: string;
    entityName?: string;
    entityId?: string;
  } | null>(null);

  // Clear conversation when switching to a different entity/mode
  useEffect(
    function clearConversationOnContextChange() {
      const prevContext = previousContextRef.current;
      const currentMode = editorContext?.mode;
      const currentEntityName = editorContext?.entityName;
      const currentEntityId = editorContext?.entityId;

      if (
        prevContext &&
        (prevContext.mode !== currentMode ||
          prevContext.entityName !== currentEntityName ||
          prevContext.entityId !== currentEntityId)
      ) {
        dispatch(clearAIResponse());
      }

      previousContextRef.current = {
        mode: currentMode,
        entityName: currentEntityName,
        entityId: currentEntityId,
      };
    },
    [
      editorContext?.mode,
      editorContext?.entityName,
      editorContext?.entityId,
      dispatch,
    ],
  );

  // Close panel when navigating to a different page
  useEffect(
    function closePanelOnRouteChange() {
      if (previousPathRef.current !== location.pathname && isOpen) {
        dispatch(closeAIPanel());
        dispatch(clearAIResponse());
      }

      previousPathRef.current = location.pathname;
    },
    [location.pathname, isOpen, dispatch],
  );

  useEffect(
    function scrollToLatestMessage() {
      if (responseRef.current && (messages.length > 0 || isLoading)) {
        responseRef.current.scrollTop = responseRef.current.scrollHeight;
      }
    },
    [messages, isLoading],
  );

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const newWidth = Math.min(
        Math.max(window.innerWidth - moveEvent.clientX, PANEL_MIN_WIDTH),
        PANEL_MAX_WIDTH,
      );

      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

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
      // A quick-action chip is a plain button, so without this a user can fire a second request while the first is
      // still running — two provider calls, two charges, and two responses racing into the same panel.
      if (isLoading) {
        return;
      }

      dispatch(
        fetchAIResponse({
          prompt: actionPrompt,
          context: editorContext || undefined,
        }),
      );
    },
    [editorContext, dispatch, isLoading],
  );

  const handleClearChat = useCallback(() => {
    dispatch(clearAIResponse());
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
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

  if (!isOpen) return null;

  return (
    <PanelContainer isOpen={isOpen} width={panelWidth}>
      <ResizeHandle onMouseDown={handleResizeMouseDown} />

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
        <ResponseSection ref={responseRef}>
          {messages.length === 0 && !isLoading && !error && (
            <EmptyState>
              <Icon className="empty-icon" name="sparkling-filled" size="lg" />
              <EmptyStateText>
                Ask me anything about your code. I can explain, fix errors,
                refactor, or help you write new functionality.
              </EmptyStateText>
            </EmptyState>
          )}

          <MessageList>
            {messages.map((message, idx) => (
              <MessageBubble isUser={message.role === "user"} key={idx}>
                <MessageHeader>
                  <Icon
                    name={message.role === "user" ? "user-3-line" : "robot"}
                    size="sm"
                  />
                  {message.role === "user" ? "You" : "AI Assistant"}
                </MessageHeader>
                {message.role === "user" ? (
                  <MessageContent>{message.content}</MessageContent>
                ) : (
                  <AIMarkdownRenderer content={message.content} />
                )}
              </MessageBubble>
            ))}
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

        <QuickActionsSection>
          <QuickActionsLabel>Quick Actions</QuickActionsLabel>
          <QuickActionsGrid>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionChip
                disabled={isLoading}
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
      </PanelContent>
    </PanelContainer>
  );
}

export default GlobalAISidePanel;
