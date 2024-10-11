import { clsx } from "clsx";
import React from "react";
import { Flex, Text } from "@appsmith/wds";
import { Avatar, Markdown } from "@appsmith/wds";

import styles from "./styles.module.css";
import type { ThreadMessageProps } from "./types";
import { AssistantSuggestionButton } from "../AssistantSuggestionButton";

export const ThreadMessage = (props: ThreadMessageProps) => {
  const {
    className,
    content,
    isAssistant,
    onApplyAssistantSuggestion,
    promptSuggestions = [],
    username,
    ...rest
  } = props;

  return (
    <li
      className={clsx(styles.root, className)}
      data-assistant={isAssistant}
      {...rest}
    >
      {isAssistant ? (
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
      ) : (
        <>
          <Avatar label={username} />
          <div>
            <Text className={styles.content}>{content}</Text>
          </div>
        </>
      )}
    </li>
  );
};
