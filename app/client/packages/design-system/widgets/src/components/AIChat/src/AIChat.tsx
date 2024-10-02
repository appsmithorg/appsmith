import { Button, Spinner, TextArea } from "@appsmith/wds";
import type { FormEvent, ForwardedRef, KeyboardEvent } from "react";
import React, { forwardRef, useCallback } from "react";
import { Text } from "../../Text";
import { ThreadMessage } from "./ThreadMessage";
import styles from "./styles.module.css";
import type { AIChatProps, Message } from "./types";

const _AIChat = (props: AIChatProps, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    // assistantName,
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
            <ThreadMessage {...message} key={message.id} />
          ))}

          {isWaitingForResponse && (
            <li>
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
