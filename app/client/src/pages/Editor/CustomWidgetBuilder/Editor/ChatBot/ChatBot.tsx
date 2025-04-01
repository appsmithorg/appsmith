import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ContentProps } from "../CodeEditors/types";
import { CustomWidgetBuilderContext } from "../..";
import {
  CUSTOM_WIDGET_AI_BOT_MESSAGE_RESPONSE_DEBOUNCE_TIMEOUT,
  CUSTOM_WIDGET_AI_BOT_URL,
  CUSTOM_WIDGET_AI_CHAT_TYPE,
  CUSTOM_WIDGET_AI_INITIALISED_MESSAGE,
} from "../../constants";
import { isObject } from "lodash";

export const ChatBot = (props: ContentProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const lastUpdateFromBot = useRef<number>(0);
  const { parentEntityId, uncompiledSrcDoc, update, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  const handleSrcDocUpdates = useCallback(() => {
    // Don't send updates back to bot if the last update came from the bot within the last 100ms
    if (
      Date.now() - lastUpdateFromBot.current <
      CUSTOM_WIDGET_AI_BOT_MESSAGE_RESPONSE_DEBOUNCE_TIMEOUT
    ) {
      return;
    }

    // Send src doc to the chatbot iframe
    if (ref.current && ref.current.contentWindow && uncompiledSrcDoc) {
      ref.current.contentWindow.postMessage(
        {
          html_code: uncompiledSrcDoc.html,
          css_code: uncompiledSrcDoc.css,
          js_code: uncompiledSrcDoc.js,
          chatType: CUSTOM_WIDGET_AI_CHAT_TYPE,
        },
        "*",
      );
    }
  }, [uncompiledSrcDoc]);

  const updateContents = useCallback(
    (
      event: MessageEvent<
        string | { html_code?: string; css_code?: string; js_code?: string }
      >,
    ) => {
      const iframeWindow =
        ref.current?.contentWindow || ref.current?.contentDocument?.defaultView;

      // Accept messages only from the current iframe
      if (event.source !== iframeWindow) return;

      if (event.data === CUSTOM_WIDGET_AI_INITIALISED_MESSAGE) {
        handleSrcDocUpdates();

        return;
      }

      if (!update) return;

      if (isObject(event.data)) {
        lastUpdateFromBot.current = Date.now();
        const { css_code, html_code, js_code } = event.data;

        if (html_code && html_code !== "") update("html", html_code);

        if (css_code && css_code !== "") update("css", css_code);

        if (js_code && js_code !== "") update("js", js_code);
      }
    },
    [handleSrcDocUpdates, update],
  );

  useEffect(
    function addEventListenerForBotUpdates() {
      // add a listener to update the contents
      window.addEventListener("message", updateContents, false);

      // clean up
      return () => window.removeEventListener("message", updateContents, false);
    },
    [updateContents],
  );

  useEffect(handleSrcDocUpdates, [handleSrcDocUpdates]);

  const instanceId = `${widgetId}-${parentEntityId}`;

  const srcUrl = useMemo(() => {
    return CUSTOM_WIDGET_AI_BOT_URL(instanceId);
  }, [instanceId]);

  return (
    <iframe height={`${props.height}px`} ref={ref} src={srcUrl} width="100%" />
  );
};
