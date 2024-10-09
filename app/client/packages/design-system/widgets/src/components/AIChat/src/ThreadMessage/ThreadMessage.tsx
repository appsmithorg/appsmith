import { Text } from "@appsmith/wds";
import { clsx } from "clsx";
import React from "react";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { UserAvatar } from "../UserAvatar";
import styles from "./styles.module.css";
import type { ThreadMessageProps } from "./types";

export const ThreadMessage = ({
  className,
  content,
  isAssistant,
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
