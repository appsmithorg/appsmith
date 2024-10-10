import { Button, Flex, Text, TextArea } from "@appsmith/wds";
import type { FormEvent, ForwardedRef, KeyboardEvent } from "react";
import React, { forwardRef, useCallback } from "react";
import { ChatDescriptionModal } from "./ChatDescriptionModal";
import { ChatTitle } from "./ChatTitle";
import styles from "./styles.module.css";
import { ThreadMessage } from "./ThreadMessage";
import type { AIChatProps, ChatMessage } from "./types";
import { UserAvatar } from "./UserAvatar";

const MIN_PROMPT_LENGTH = 3;

const _AIChat = (props: AIChatProps, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    // assistantName,
    chatDescription,
    chatTitle,
    isWaitingForResponse = false,
    onApplyAssistantSuggestion,
    onPromptChange,
    onSubmit,
    prompt,
    promptInputPlaceholder,
    thread,
    username,
    ...rest
  } = props;
  const [isChatDescriptionModalOpen, setIsChatDescriptionModalOpen] =
    React.useState(false);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit?.();
    },
    [onSubmit],
  );

  const handlePromptInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        onSubmit?.();
      }
    },
    [onSubmit],
  );

  return (
    <div className={styles.root} ref={ref} {...rest}>
      <ChatDescriptionModal
        isOpen={isChatDescriptionModalOpen}
        setOpen={() =>
          setIsChatDescriptionModalOpen(!isChatDescriptionModalOpen)
        }
      >
        {chatDescription}
      </ChatDescriptionModal>

      <div className={styles.header}>
        <Flex alignItems="center" gap="8px">
          <ChatTitle title={chatTitle} />
          <Button
            icon="info-square-rounded"
            onPress={() => setIsChatDescriptionModalOpen(true)}
            variant="ghost"
          />
        </Flex>

        <Flex alignItems="center" gap="8px">
          <UserAvatar username={username} />
          <Text data-testid="t--aichat-username" size="body">
            {username}
          </Text>
        </Flex>
      </div>

      <ul className={styles.thread} data-testid="t--aichat-thread">
        {thread.map((message: ChatMessage) => (
          <ThreadMessage
            {...message}
            key={message.id}
            onApplyAssistantSuggestion={onApplyAssistantSuggestion}
            username={username}
          />
        ))}
      </ul>

      <form className={styles.promptForm} onSubmit={handleFormSubmit}>
        <TextArea
          // TODO: Handle isWaitingForResponse: true state
          isDisabled={isWaitingForResponse}
          name="prompt"
          onChange={onPromptChange}
          onKeyDown={handlePromptInputKeyDown}
          placeholder={promptInputPlaceholder}
          value={prompt}
        />
        <Button isDisabled={prompt.length < MIN_PROMPT_LENGTH} type="submit">
          Send
        </Button>
      </form>
    </div>
  );
};

export const AIChat = forwardRef(_AIChat);
