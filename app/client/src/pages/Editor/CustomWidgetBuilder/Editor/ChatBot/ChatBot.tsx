import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ContentProps } from "../CodeEditors/types";
import { CustomWidgetBuilderContext } from "../..";

export const ChatBot = (props: ContentProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const { parentEntityId, uncompiledSrcDoc, update, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );
  const chatType = "CUSTOM_WIDGET";

  const handleSrcDocUpdates = useCallback(() => {
    // Send src doc to the chatbot iframe
    if (ref.current && ref.current.contentWindow && uncompiledSrcDoc) {
      ref.current.contentWindow.postMessage(
        {
          html_code: uncompiledSrcDoc.html,
          css_code: uncompiledSrcDoc.css,
          js_code: uncompiledSrcDoc.js,
          chatType,
        },
        "*",
      );
    }
  }, [uncompiledSrcDoc, chatType]);

  const updateContents = useCallback(
    (event: MessageEvent) => {
      const iframeWindow =
        ref.current?.contentWindow || ref.current?.contentDocument?.defaultView;

      // Accept messages only from the current iframe
      if (event.source !== iframeWindow) return;

      if (event.data === "CHAT_INITIALISED") {
        handleSrcDocUpdates();
      }

      if (!update) return;

      if (event.data.html_code) {
        update("html", event.data.html_code);
      }

      if (event.data.css_code) {
        update("css", event.data.css_code);
      }

      if (event.data.html_code) {
        update("js", event.data.js_code);
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
    return `https://internal.appsmith.com/app/app-builder-bot/custom-widget-bot-672b2020d37b7d0b29dcfa71?embed=true&chatType=${chatType}&chatInstance=${instanceId}&url=${encodeURIComponent(window.location.origin)}`;
  }, [instanceId]);

  return (
    <iframe height={`${props.height}px`} ref={ref} src={srcUrl} width="100%" />
  );
};
