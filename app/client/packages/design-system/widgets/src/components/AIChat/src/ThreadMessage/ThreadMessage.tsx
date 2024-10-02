import React from "react";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { ThreadMessageProps } from "./types";
import styles from "./styles.module.css";

export const ThreadMessage = ({ content, id, role }: ThreadMessageProps) => {
  return (
    <li className={styles.root} data-role={role} key={id}>
      {role === "assistant" ? (
        <p className={styles.content}>
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
        </p>
      ) : (
        <p className={styles.content}>{content}</p>
      )}
    </li>
  );
};
