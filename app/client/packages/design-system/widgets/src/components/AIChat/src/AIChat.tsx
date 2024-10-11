import type { ForwardedRef } from "react";
import React, { forwardRef } from "react";

import styles from "./styles.module.css";
import { ChatHeader } from "./ChatHeader";
import { ChatThread } from "./ChatThread";
import type { AIChatProps } from "./types";
import { ChatInputSection } from "./ChatInputSection";

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

  return (
    <div className={styles.root} ref={ref} {...rest}>
      <ChatHeader
        chatDescription={chatDescription}
        chatTitle={chatTitle}
        username={username}
      />

      <ChatThread
        onApplyAssistantSuggestion={onApplyAssistantSuggestion}
        thread={thread}
        username={username}
      />

      <ChatInputSection
        isWaitingForResponse={isWaitingForResponse}
        onPromptChange={onPromptChange}
        onSubmit={onSubmit}
        prompt={prompt}
        promptInputPlaceholder={promptInputPlaceholder}
      />
    </div>
  );
};

export const AIChat = forwardRef(_AIChat);
