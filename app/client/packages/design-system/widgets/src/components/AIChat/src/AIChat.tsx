import { Avatar, Button, ChatInput, Flex, Icon, Text } from "@appsmith/wds";
import type { ForwardedRef } from "react";
import React, { forwardRef } from "react";
import { ChatDescriptionModal } from "./ChatDescriptionModal";
import styles from "./styles.module.css";
import { ThreadMessage } from "./ThreadMessage";
import type { AIChatProps, ChatMessage } from "./types";

const MIN_PROMPT_LENGTH = 3;
const LOGO =
  "https://app.appsmith.com/static/media/appsmith_logo_square.3867b1959653dabff8dc.png";

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

  return (
    <div className={styles.root} ref={ref} {...rest}>
      <ChatDescriptionModal
        isOpen={isChatDescriptionModalOpen}
        setOpen={setIsChatDescriptionModalOpen}
      >
        {chatDescription}
      </ChatDescriptionModal>

      <div className={styles.header}>
        <Flex alignItems="center" gap="spacing-2">
          <Flex alignItems="center" gap="spacing-3">
            <Avatar label="Appsmith AI" size="large" src={LOGO} />
            <Text fontWeight={600} size="subtitle">
              {chatTitle}
            </Text>
          </Flex>
          <Button
            icon="info-square-rounded"
            onPress={() => setIsChatDescriptionModalOpen(true)}
            variant="ghost"
          />
        </Flex>

        <Flex alignItems="center" gap="spacing-2">
          <Avatar label={username} />
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

      <Flex
        direction="column"
        gap="spacing-3"
        paddingBottom="spacing-4"
        paddingLeft="spacing-6"
        paddingRight="spacing-6"
        paddingTop="spacing-4"
      >
        <ChatInput
          isLoading={isWaitingForResponse}
          isSubmitDisabled={prompt.length < MIN_PROMPT_LENGTH}
          onChange={onPromptChange}
          onSubmit={onSubmit}
          placeholder={promptInputPlaceholder}
          value={prompt}
        />
        <Flex
          alignItems="center"
          flexGrow={1}
          gap="spacing-1"
          justifyContent="center"
        >
          <Icon name="alert-circle" size="small" />
          <Text color="neutral" size="caption" textAlign="center">
            LLM assistant can make mistakes. Answers should be verified before
            they are trusted.
          </Text>
        </Flex>
      </Flex>
    </div>
  );
};

export const AIChat = forwardRef(_AIChat);
