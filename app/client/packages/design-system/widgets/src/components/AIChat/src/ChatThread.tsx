import React from "react";
import { Avatar, Flex, Markdown } from "@appsmith/wds";

import styles from "./styles.module.css";
import type { ChatMessage } from "./types";
import { AssistantSuggestionButton } from "./AssistantSuggestionButton";

export const ChatThread: React.FC<{
  thread: ChatMessage[];
  onApplyAssistantSuggestion?: (suggestion: string) => void;
  username: string;
}> = ({ onApplyAssistantSuggestion, thread, username }) => (
  <Flex direction="column" gap="spacing-3" padding="spacing-6">
    {thread.map((message: ChatMessage) => {
      const { content, isAssistant, promptSuggestions = [] } = message;

      return (
        <Flex direction={isAssistant ? "row" : "row-reverse"} key={message.id}>
          {isAssistant && (
            <div>
              <Markdown>{content}</Markdown>

              {promptSuggestions.length > 0 && (
                <Flex
                  className={styles.suggestions}
                  gap="spacing-5"
                  paddingTop="spacing-4"
                  wrap="wrap"
                >
                  {promptSuggestions.map((suggestion) => (
                    <AssistantSuggestionButton
                      key={suggestion}
                      // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
                      onPress={() => onApplyAssistantSuggestion?.(suggestion)}
                    >
                      {suggestion}
                    </AssistantSuggestionButton>
                  ))}
                </Flex>
              )}
            </div>
          )}
          {!isAssistant && (
            <Flex direction="row-reverse" gap="spacing-3">
              <Avatar label={username} />
              <div>{content}</div>
            </Flex>
          )}
        </Flex>
      );
    })}
  </Flex>
);
