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
  getAIEditorContext,
} from "ee/selectors/aiAssistantSelectors";
import { getAIContext } from "./trigger";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Ask AI is CE-owned; CE cannot add an ee/ shim (pre-push architecture guard).
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
  EmptyState,
  EmptyStateText,
  getModeLabel,
  QUICK_ACTIONS,
  AIMarkdownRenderer,
  ResizeHandle,
} from "ce/components/editorComponents/GPT/shared";

// ============================================================================
// Constants
// ============================================================================

const PANEL_DEFAULT_WIDTH = 380;
const PANEL_MIN_WIDTH = 320;
const PANEL_MAX_WIDTH = 720;

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

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
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
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);
  const messages = useSelector(getAIMessages);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);
  const editorContext = useSelector(getAIEditorContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const detachDragRef = useRef<(() => void) | null>(null);
  const inFlightRef = useRef(false);
  const [cursorLine, setCursorLine] = useState(0);

  useEffect(() => {
    dispatch(clearAIResponse());
    setPrompt("");
  }, [mode, editorContext?.entityName, editorContext?.entityId, dispatch]);

  // The context label reports the line the request will be built from, so it has to follow the
  // caret. Without this it only refreshed when the editor or mode changed, and the label kept
  // showing the line the panel happened to open on while submission sent the real position.
  // Tracking the line rather than the full position keeps this off the per-keystroke path.
  useEffect(
    function trackCursorLine() {
      if (!editor) return;

      const syncCursorLine = () => setCursorLine(editor.getCursor().line);

      syncCursorLine();
      editor.on("cursorActivity", syncCursorLine);

      return () => {
        editor.off("cursorActivity", syncCursorLine);
      };
    },
    [editor],
  );

  // A drag that is still active when the panel unmounts would otherwise leave both document
  // listeners attached for the rest of the session, calling setPanelWidth on a dead component.
  useEffect(() => () => detachDragRef.current?.(), []);

  // The saga owns the request lifecycle; mirror it into a ref so a second click landing in the
  // same tick — before React has re-rendered with isLoading — still sees one in progress.
  useEffect(
    function releaseInFlightGuard() {
      if (!isLoading) {
        inFlightRef.current = false;
      }
    },
    [isLoading],
  );

  // Scroll to bottom on new messages or while loading
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const contextInfo = useMemo(() => {
    if (!editor) return null;

    return {
      lineNumber: cursorLine + 1,
      mode: getModeLabel(mode),
    };
  }, [editor, mode, cursorLine]);

  // ── Resize handle ──────────────────────────────────────────────────────────

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
      detachDragRef.current = null;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    detachDragRef.current = onMouseUp;
  }, []);

  // ── Panel actions ──────────────────────────────────────────────────────────

  // Guarded as well as disabled: clearing mid-request would empty the list that the saga is about
  // to append the in-flight response to, leaving an answer with no question above it.
  const handleClearChat = useCallback(() => {
    if (isLoading) return;

    dispatch(clearAIResponse());
    setPrompt("");
  }, [dispatch, isLoading]);

  // Every submission path funnels through here. Previously the send button and each quick-action
  // chip dispatched independently, and the chips stayed active while a request was running, so two
  // clicks queued two prompts against a single loading flag — duplicate chat entries and a second
  // billable provider call.
  const submitPrompt = useCallback(
    (rawPrompt: string) => {
      const trimmedPrompt = rawPrompt.trim();

      if (!trimmedPrompt || !editor || inFlightRef.current || isLoading) {
        return;
      }

      inFlightRef.current = true;

      const cursorPosition = editor.getCursor();
      const context = getAIContext({
        cursorPosition,
        editor,
      });

      dispatch(
        fetchAIResponse({
          prompt: trimmedPrompt,
          context: {
            ...context,
            currentValue,
            mode,
          },
        }),
      );
      setPrompt("");
    },
    [editor, isLoading, mode, currentValue, dispatch],
  );

  const handleSend = useCallback(
    () => submitPrompt(prompt),
    [submitPrompt, prompt],
  );

  const handleQuickAction = useCallback(
    (actionPrompt: string) => submitPrompt(actionPrompt),
    [submitPrompt],
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
    <PanelContainer isOpen={isOpen} width={panelWidth}>
      <ResizeHandle onMouseDown={handleResizeMouseDown} />

      <PanelHeader>
        <HeaderTitle>
          <Icon className="sparkle-icon" name="sparkling-filled" size="md" />
          <Text kind="heading-xs">AI Assistant</Text>
        </HeaderTitle>
        <HeaderActions>
          {messages.length > 0 && (
            <Tooltip content="Clear chat" placement="bottom">
              <ClearChatButton
                isDisabled={isLoading}
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
        </HeaderActions>
      </PanelHeader>

      <PanelContent>
        {/* Messages area — grows to fill available space, scrolls */}
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
                    <AIMarkdownRenderer content={message.content} />
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

        {/* Quick action chips — above input */}
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
                disabled={isLoading}
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

        {/* Context indicator — subtle label just above the input */}
        {contextInfo && (
          <ContextSection>
            <ContextLabel>
              <Icon className="context-icon" name="eye-on" size="sm" />
              Context: <code>{contextInfo.mode}</code>
              {" · "}Line {contextInfo.lineNumber}
            </ContextLabel>
          </ContextSection>
        )}

        {/* Input area — pinned to bottom */}
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
              isDisabled={!prompt.trim() || isLoading}
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

export default AISidePanel;
