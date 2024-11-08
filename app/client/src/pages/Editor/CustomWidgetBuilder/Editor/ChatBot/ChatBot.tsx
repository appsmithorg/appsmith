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
  CUSTOM_WIDGET_AI_BOT_URL,
  CUSTOM_WIDGET_AI_CHAT_TYPE,
  CUSTOM_WIDGET_AI_INITIALISED_MESSAGE,
} from "../../constants";
import { isObject } from "lodash";

export const ChatBot = (props: ContentProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const { parentEntityId, uncompiledSrcDoc, update, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  const handleSrcDocUpdates = useCallback(() => {
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
        if (event.data.html_code) {
          update("html", event.data.html_code);
        }

        if (event.data.css_code) {
          update("css", event.data.css_code);
        }

        if (event.data.js_code) {
          update("js", event.data.js_code);
        }
      }
    },
    [uncompiledSrcDoc, update],
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
