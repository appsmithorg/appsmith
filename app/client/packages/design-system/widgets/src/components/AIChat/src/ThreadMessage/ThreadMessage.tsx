import { Text } from "@appsmith/wds";
import { clsx } from "clsx";
import React from "react";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { AssistantSuggestionButton } from "../AssistantSuggestionButton";
import { UserAvatar } from "../UserAvatar";
import styles from "./styles.module.css";
import type { ThreadMessageProps } from "./types";

export const ThreadMessage = ({
  className,
  content,
  isAssistant,
  onApplyAssistantSuggestion,
  promptSuggestions = [],
  username,
  ...rest
}: ThreadMessageProps) => {
  return (
    <li
      className={clsx(styles.root, className)}
      data-assistant={isAssistant}
      {...rest}
    >
      {isAssistant ? (
        <div>
          <Text className={styles.content}>
            <Markdown
              // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className ?? "");

                  return match ? (
                    <SyntaxHighlighter
                      PreTag="div"
                      language={match[1]}
                      style={monokai}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </Markdown>
          </Text>

          {promptSuggestions.length > 0 && (
            <div className={styles.suggestions}>
              {promptSuggestions.map((suggestion) => (
                <AssistantSuggestionButton
                  key={suggestion}
                  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
                  onPress={() => onApplyAssistantSuggestion?.(suggestion)}
                >
                  {suggestion}
                </AssistantSuggestionButton>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <UserAvatar className={styles.userAvatar} username={username} />
          <div>
            <Text className={styles.content}>{content}</Text>
          </div>
        </>
      )}
    </li>
  );
};
