import React from "react";
import { Flex, ChatInput, Icon, Text } from "@appsmith/wds";

const MIN_PROMPT_LENGTH = 3;

export const ChatInputSection: React.FC<{
  isWaitingForResponse: boolean;
  prompt: string;
  promptInputPlaceholder?: string;
  onPromptChange: (value: string) => void;
  onSubmit?: () => void;
}> = ({
  isWaitingForResponse,
  onPromptChange,
  onSubmit,
  prompt,
  promptInputPlaceholder,
}) => (
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
        LLM assistant can make mistakes. Answers should be verified before they
        are trusted.
      </Text>
    </Flex>
  </Flex>
);
