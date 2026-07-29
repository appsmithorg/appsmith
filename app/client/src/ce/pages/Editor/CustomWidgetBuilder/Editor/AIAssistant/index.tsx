import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import { objectKeys } from "@appsmith/utils";
import { Button, Icon, Spinner, Text, Tooltip } from "@appsmith/ads";
import type { ContentProps } from "pages/Editor/CustomWidgetBuilder/Editor/CodeEditors/types";
import { CustomWidgetBuilderContext } from "pages/Editor/CustomWidgetBuilder";
import {
  clearAIResponse,
  fetchAIResponse,
  loadAISettings,
} from "ee/actions/aiAssistantActions";
import type { AIMessage } from "ee/actions/aiAssistantActions";
import {
  getAIAssistantState,
  getAIError,
  getAIMessages,
  getHasAIApiKey,
  getIsAIConfigLoaded,
  getIsAIEnabled,
  getIsAILoading,
} from "ee/selectors/aiAssistantSelectors";
import {
  createMessage,
  CUSTOM_WIDGET_AI_ASSISTANT,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import NotConfigured from "./NotConfigured";
import {
  buildWidgetAIContext,
  CUSTOM_WIDGET_AI_MODE,
  extractCodeUpdates,
  stripCodeUpdates,
} from "./utils";

export const Container = styled.div<{ height: number }>`
  display: flex;
  flex-direction: column;
  height: ${(props) => props.height}px;
  background: var(--ads-v2-color-bg);
`;

const SUGGESTED_PROMPTS = [
  {
    label: CUSTOM_WIDGET_AI_ASSISTANT.EDITABLE_DATA_GRID_LABEL,
    prompt: CUSTOM_WIDGET_AI_ASSISTANT.EDITABLE_DATA_GRID_PROMPT,
  },
  {
    label: CUSTOM_WIDGET_AI_ASSISTANT.KANBAN_BOARD_LABEL,
    prompt: CUSTOM_WIDGET_AI_ASSISTANT.KANBAN_BOARD_PROMPT,
  },
  {
    label: CUSTOM_WIDGET_AI_ASSISTANT.IMAGE_LABELER_LABEL,
    prompt: CUSTOM_WIDGET_AI_ASSISTANT.IMAGE_LABELER_PROMPT,
  },
  {
    label: CUSTOM_WIDGET_AI_ASSISTANT.CALENDAR_LABEL,
    prompt: CUSTOM_WIDGET_AI_ASSISTANT.CALENDAR_PROMPT,
  },
];

const APPLIED_FILE_LABELS: Record<string, string> = {
  html: "HTML",
  css: "Style",
  js: "Javascript",
};

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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  color: var(--ads-v2-color-fg-muted);
  text-align: center;
`;

const EmptyStateText = styled.div`
  max-width: 320px;
  font-size: 13px;
  line-height: 1.5;
`;

const LoadingState = styled.div`
  padding: 12px 16px;
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg-subtle);
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
  border: 1px solid var(--ads-v2-color-border-error);
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg-error);
  color: var(--ads-v2-color-fg-error);
  font-size: 13px;
`;

const CenterState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--ads-v2-color-fg-muted);
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  padding: 12px 16px;
  border-radius: var(--ads-v2-border-radius);
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

const UserMessageContent = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: var(--ads-v2-color-fg);
  white-space: pre-wrap;
  word-break: break-word;
`;

const AppliedUpdates = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ads-v2-color-border);
`;

const AppliedChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border-success);
  background: var(--ads-v2-color-bg-success);
  color: var(--ads-v2-color-fg-success);
  font-size: 12px;
`;

const SuggestedPrompts = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
`;

const SuggestedPromptChip = styled.button`
  padding: 6px 12px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }
`;

const InputArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--ads-v2-color-border);
`;

const PromptTextArea = styled.textarea`
  width: 100%;
  min-height: 60px;
  max-height: 160px;
  padding: 10px 12px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--ads-v2-color-border-emphasis);
  }

  &::placeholder {
    color: var(--ads-v2-color-fg-muted);
  }
`;

const InputActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

interface SuggestedPromptButtonProps {
  label: string;
  prompt: string;
  onSelect: (prompt: string) => void;
}

function SuggestedPromptButton(props: SuggestedPromptButtonProps) {
  const { label, onSelect, prompt } = props;

  const handleClick = useCallback(() => {
    onSelect(prompt);
  }, [onSelect, prompt]);

  return (
    <SuggestedPromptChip onClick={handleClick} title={prompt} type="button">
      {label}
    </SuggestedPromptChip>
  );
}

export function AIAssistant(props: ContentProps) {
  const dispatch = useDispatch();
  const { bulkUpdate, uncompiledSrcDoc, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  const isEnabled = useSelector(getIsAIEnabled);
  const aiAssistantState = useSelector(getAIAssistantState);
  const hasApiKey = useSelector(getHasAIApiKey);
  const isConfigLoaded = useSelector(getIsAIConfigLoaded);
  // CE's selector stub intentionally exposes an empty `never[]`; EE replaces
  // the selector implementation after community sync while keeping this
  // shared message contract.
  const messages = useSelector(getAIMessages) as AIMessage[];
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);

  const [prompt, setPrompt] = useState("");
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const lastAppliedTimestampRef = useRef(0);

  // Keep the latest code in a ref so the message-driven apply effect and the
  // send handler never capture a stale srcDoc.
  const srcDocRef = useRef(uncompiledSrcDoc);

  useEffect(
    function trackLatestSrcDoc() {
      srcDocRef.current = uncompiledSrcDoc;
    },
    [uncompiledSrcDoc],
  );

  const isConfigured = isEnabled && hasApiKey;

  useEffect(
    function initializeAssistant() {
      dispatch(loadAISettings());
      dispatch(clearAIResponse());
    },
    [dispatch],
  );

  useEffect(
    function applyCodeUpdatesFromAssistant() {
      const lastMessage = messages[messages.length - 1];

      if (
        !lastMessage ||
        lastMessage.role !== "assistant" ||
        lastMessage.timestamp <= lastAppliedTimestampRef.current
      ) {
        return;
      }

      const updates = extractCodeUpdates(lastMessage.content);
      const updatedFiles = objectKeys(updates);

      if (updatedFiles.length === 0) {
        lastAppliedTimestampRef.current = lastMessage.timestamp;

        return;
      }

      // Don't mark the message as processed yet: the builder context may
      // still be initializing. The effect re-runs when bulkUpdate or the
      // srcDoc arrive, so the update is applied instead of being dropped.
      if (!bulkUpdate || !srcDocRef.current) {
        return;
      }

      lastAppliedTimestampRef.current = lastMessage.timestamp;

      bulkUpdate({
        html: updates.html ?? srcDocRef.current.html,
        css: updates.css ?? srcDocRef.current.css,
        js: updates.js ?? srcDocRef.current.js,
      });

      updatedFiles.forEach((file) => {
        AnalyticsUtil.logEvent("CUSTOM_WIDGET_BUILDER_SRCDOC_UPDATE", {
          widgetId,
          srcDocFile: file,
          trigger: "ai_assistant",
        });
      });
    },
    [messages, bulkUpdate, uncompiledSrcDoc, widgetId],
  );

  useEffect(
    function scrollToLatestMessage() {
      if (messageAreaRef.current && (messages.length > 0 || isLoading)) {
        messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
      }
    },
    [messages, isLoading],
  );

  const sendPrompt = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (!trimmed || isLoading) return;

      dispatch(
        fetchAIResponse({
          prompt: trimmed,
          context: {
            mode: CUSTOM_WIDGET_AI_MODE,
            functionString: buildWidgetAIContext(srcDocRef.current),
          },
        }),
      );
      setPrompt("");
    },
    [dispatch, isLoading],
  );

  const handleSend = useCallback(() => {
    sendPrompt(prompt);
  }, [sendPrompt, prompt]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleClearChat = useCallback(() => {
    dispatch(clearAIResponse());
    lastAppliedTimestampRef.current = 0;
  }, [dispatch]);

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(event.target.value);
    },
    [],
  );

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => {
        if (message.role === "user") {
          return { ...message, appliedFiles: [] as string[] };
        }

        return {
          ...message,
          content: stripCodeUpdates(message.content),
          appliedFiles: objectKeys(extractCodeUpdates(message.content)),
        };
      }),
    [messages],
  );

  // CE exposes the Ask AI selector contract as a safe stub without registering
  // the EE reducer or sagas. Render the CE fallback immediately in that case;
  // after community sync, EE's selector resolves the configured runtime state
  // and activates this same component without an EE-specific shadow copy.
  if (!aiAssistantState) {
    return (
      <Container height={props.height}>
        <NotConfigured />
      </Container>
    );
  }

  if (!isConfigLoaded) {
    return (
      <Container height={props.height}>
        <CenterState data-testid="t--custom-widget-ai-loading-config">
          <Spinner size="md" />
          <Text kind="body-m">
            {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.CHECKING_CONFIG)}
          </Text>
        </CenterState>
      </Container>
    );
  }

  if (!isConfigured) {
    return (
      <Container height={props.height}>
        <NotConfigured showSettingsCta />
      </Container>
    );
  }

  return (
    <Container
      data-testid="t--custom-widget-ai-assistant"
      height={props.height}
    >
      <MessageArea ref={messageAreaRef}>
        {messages.length === 0 && !isLoading && !error && (
          <EmptyState>
            <Icon className="empty-icon" name="sparkling-filled" size="lg" />
            <EmptyStateText>
              {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.EMPTY_STATE_MESSAGE)}
            </EmptyStateText>
            <SuggestedPrompts>
              {SUGGESTED_PROMPTS.map((suggestion) => (
                <SuggestedPromptButton
                  key={createMessage(suggestion.label)}
                  label={createMessage(suggestion.label)}
                  onSelect={sendPrompt}
                  prompt={createMessage(suggestion.prompt)}
                />
              ))}
            </SuggestedPrompts>
          </EmptyState>
        )}

        {renderedMessages.map((message, index) => (
          <MessageBubble
            isUser={message.role === "user"}
            key={`${message.timestamp}-${index}`}
          >
            <MessageHeader>
              <Icon
                name={message.role === "user" ? "user-3-line" : "robot"}
                size="sm"
              />
              {message.role === "user"
                ? createMessage(CUSTOM_WIDGET_AI_ASSISTANT.USER_LABEL)
                : createMessage(CUSTOM_WIDGET_AI_ASSISTANT.ASSISTANT_LABEL)}
            </MessageHeader>
            <UserMessageContent>{message.content}</UserMessageContent>
            {message.appliedFiles.length > 0 && (
              <AppliedUpdates>
                <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                  {createMessage(
                    CUSTOM_WIDGET_AI_ASSISTANT.APPLIED_UPDATES_LABEL,
                  )}
                </Text>
                {message.appliedFiles.map((file) => (
                  <AppliedChip key={file}>
                    <Icon name="check-line" size="sm" />
                    {APPLIED_FILE_LABELS[file] ?? file}
                  </AppliedChip>
                ))}
              </AppliedUpdates>
            )}
          </MessageBubble>
        ))}

        {isLoading && (
          <LoadingState>
            <LoadingText>
              <Icon name="loader-line" size="sm" />
              {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.THINKING)}
            </LoadingText>
          </LoadingState>
        )}

        {error && !isLoading && <ErrorState>{error}</ErrorState>}
      </MessageArea>

      <InputArea>
        <PromptTextArea
          data-testid="t--custom-widget-ai-prompt-input"
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          placeholder={createMessage(
            CUSTOM_WIDGET_AI_ASSISTANT.INPUT_PLACEHOLDER,
          )}
          value={prompt}
        />
        <InputActions>
          {messages.length > 0 && (
            <Tooltip
              content={createMessage(CUSTOM_WIDGET_AI_ASSISTANT.CLEAR_CHAT)}
              placement="top"
            >
              <Button
                isIconButton
                kind="tertiary"
                onClick={handleClearChat}
                size="sm"
                startIcon="delete-bin-line"
              />
            </Tooltip>
          )}
          <Button
            data-testid="t--custom-widget-ai-send"
            isDisabled={!prompt.trim()}
            isLoading={isLoading}
            kind="primary"
            onClick={handleSend}
            size="sm"
          >
            {createMessage(CUSTOM_WIDGET_AI_ASSISTANT.SEND)}
          </Button>
        </InputActions>
      </InputArea>
    </Container>
  );
}
