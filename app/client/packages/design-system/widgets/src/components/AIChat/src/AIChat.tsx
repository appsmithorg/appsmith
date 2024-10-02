import { Button, Spinner, TextArea } from "@appsmith/wds";
import type { FormEvent, ForwardedRef, KeyboardEvent } from "react";
import React, { forwardRef, useCallback } from "react";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Text } from "../../Text";
import styles from "./styles.module.css";
import type { AIChatProps, Message } from "./types";

const _AIChat = (props: AIChatProps, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    assistantName,
    description,
    isWaitingForResponse = false,
    onPromptChange,
    onSubmit,
    prompt,
    promptInputPlaceholder,
    thread,
    title,
    ...rest
  } = props;

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
      <div className={styles.header}>
        {title ?? <Text size="heading">{title}</Text>}

        {description ?? <Text size="body">{description}</Text>}
      </div>

      <div className={styles.body}>
        <ul className={styles.thread}>
          {thread.map((message: Message) => (
            <li
              className={styles.message}
              data-role={message.role}
              key={message.id}
            >
              {message.role === "assistant" ? (
                <div>
                  {assistantName}
                  <Markdown
                    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
                    components={{
                      // h1: ({ children }) => (
                      //   <Text size="heading" wordBreak="break-word">
                      //     {children}
                      //   </Text>
                      // ),
                      // h2: ({ children }) => (
                      //   <Text size="title" wordBreak="break-word">
                      //     {children}
                      //   </Text>
                      // ),
                      // h3: ({ children }) => (
                      //   <Text size="subtitle" wordBreak="break-word">
                      //     {children}
                      //   </Text>
                      // ),
                      // p: ({ children }) => (
                      //   <Text size="body" wordBreak="break-word">
                      //     {children}
                      //   </Text>
                      // ),
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
                    {message.content}
                  </Markdown>
                </div>
              ) : (
                message.content
              )}
            </li>
          ))}

          {isWaitingForResponse && (
            <li className={styles.message} data-role="bot">
              <Spinner />
            </li>
          )}
        </ul>
      </div>

      <form className={styles.promptForm} onSubmit={handleFormSubmit}>
        <TextArea
          name="prompt"
          onChange={onPromptChange}
          onKeyDown={handlePromptInputKeyDown}
          placeholder={promptInputPlaceholder}
          value={prompt}
        />
        <Button isDisabled={prompt.length < 3} type="submit">
          Send
        </Button>
      </form>
    </div>
  );
};

export const AIChat = forwardRef(_AIChat);
