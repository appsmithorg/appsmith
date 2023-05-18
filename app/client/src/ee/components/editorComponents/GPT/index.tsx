export * from "ce/components/editorComponents/GPT";

import React, { useEffect } from "react";
import { AskAI } from "./AskAI";
import type { TAssistantPrompt } from "./utils";
import { useGPTTask } from "./utils";
import type { TAIWrapperProps } from "ce/components/editorComponents/GPT";
import { Popover2 } from "@blueprintjs/popover2";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { usePrevious } from "@mantine/hooks";

export function AIWindow(props: TAIWrapperProps) {
  if (!props.enableAIAssistance) {
    //eslint-disable-next-line
    return <>{props.children}</>;
  }
  return <FloatingAIWindow {...props} />;
}

function FloatingAIWindow(props: TAIWrapperProps) {
  /**
   * Store the AI response
   * `null` value represents the state when AI response is either not generated or rejected.
   */
  const [response, setResponse] = React.useState<TAssistantPrompt | null>(null);
  const task = useGPTTask();

  /**
   * Called when AI response is received
   * Stores the response and calls the update method
   * @param value
   */
  const updateResponse = (value: TAssistantPrompt | null) => {
    setResponse(value);
    props.update?.(`{{${value?.content}}}`);
  };

  const prevOpen = usePrevious(props.isOpen);

  /**
   * Holds the default value of the property
   */
  const defaultValue = React.useRef<string>(props.currentValue);

  useEffect(() => {
    if (prevOpen !== props.isOpen && props.isOpen) {
      defaultValue.current = props.currentValue;
    }
  }, [props.isOpen, props.currentValue, prevOpen]);

  /**
   * When this is invoked the field should already be updated.
   * Logs analytics and closes the popover.
   * @param query
   * @param task
   */
  const acceptResponse = (query: string) => {
    if (response) {
      AnalyticsUtil.logEvent("AI_RESPONSE_FEEDBACK", {
        responseId: response.messageId,
        requestedOutputType: task,
        liked: true,
        generatedCode: response.content,
        userQuery: query,
      });
    }
    defaultValue.current = props.currentValue;
    setResponse(null);
    props.close();
  };

  /**
   * Sets the AI response to null and restore the property to its default value.
   * @param query
   * @param task
   */
  const rejectResponse = (query: string, implicit = false) => {
    // If response is empty, all changes are committed.
    if (!response) return;
    if (!query) return;
    AnalyticsUtil.logEvent("AI_RESPONSE_FEEDBACK", {
      responseId: response.messageId,
      requestedOutputType: task.id,
      liked: false,
      implicit,
      generatedCode: response.content,
      userQuery: query,
    });
    setResponse(null);
    props.update?.(defaultValue.current || "");
  };
  return (
    <Popover2
      autoFocus={false}
      className="w-full"
      content={
        <AskAI
          acceptResponse={acceptResponse}
          close={props.close}
          dataTreePath={props.dataTreePath}
          rejectResponse={rejectResponse}
          response={response}
          triggerContext={props.triggerContext}
          updateResponse={updateResponse}
        />
      }
      enforceFocus={false}
      isOpen={props.isOpen}
      minimal
      modifiers={{
        preventOverflow: {
          enabled: true,
        },
      }}
      placement="bottom-end"
      popoverClassName="w-[320px]"
      portalClassName="ai-window"
    >
      {props.children}
    </Popover2>
  );
}
