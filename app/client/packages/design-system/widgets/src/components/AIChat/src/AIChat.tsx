import { Button, Spinner, Text, TextArea } from "@appsmith/wds";
import type { FormEvent, ForwardedRef, KeyboardEvent } from "react";
import React, { forwardRef, useCallback } from "react";
import { ChatTitle } from "./ChatTitle";
import styles from "./styles.module.css";
import { ThreadMessage } from "./ThreadMessage";
import type { AIChatProps, ChatMessage } from "./types";
import { UserAvatar } from "./UserAvatar";

const MIN_PROMPT_LENGTH = 3;

const _AIChat = (props: AIChatProps, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    // assistantName,
    chatTitle,
    description,
    isWaitingForResponse = false,
    onPromptChange,
    onSubmit,
    prompt,
    promptInputPlaceholder,
    thread,
    username,
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
        {chatTitle != null && <ChatTitle title={chatTitle} />}

        {description ?? <Text size="body">{description}</Text>}
        <div className={styles.username}>
          <UserAvatar username={username} />
          <Text size="body">{username}</Text>
        </div>
      </div>

      <ul className={styles.thread}>
        {thread.map((message: ChatMessage) => (
          <ThreadMessage {...message} key={message.id} username={username} />
        ))}

        {isWaitingForResponse && (
          <li>
            <Spinner />
          </li>
        )}
      </ul>

      <form className={styles.promptForm} onSubmit={handleFormSubmit}>
        <TextArea
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
