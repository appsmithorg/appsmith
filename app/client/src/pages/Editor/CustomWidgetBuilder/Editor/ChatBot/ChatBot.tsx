import React, { useCallback, useContext, useEffect, useRef } from "react";
import type { ContentProps } from "../CodeEditors/types";
import { CustomWidgetBuilderContext } from "../..";

export const ChatBot = (props: ContentProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const { srcDoc, update } = useContext(CustomWidgetBuilderContext);

  const updateContents = useCallback(
    (event: MessageEvent) => {
      const iframeWindow =
        ref.current?.contentWindow || ref.current?.contentDocument?.defaultView;

      // Accept messages only from the current iframe
      if (event.source !== iframeWindow) return;

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
    [update],
  );

  useEffect(() => {
    // add a listener to update the contents
    window.addEventListener("message", updateContents, false);

    // on mount, send the initial contents to the bot
    if (ref.current && ref.current.contentWindow && srcDoc) {
      ref.current.contentWindow.postMessage(
        { html_code: srcDoc.html, css_code: srcDoc.css, js_code: srcDoc.js },
        "*",
      );
    }

    // clean up
    return () => window.removeEventListener("message", updateContents, false);
  }, []);

  return (
    <iframe
      height={`${props.height}px`}
      ref={ref}
      src="https://internal.appsmith.com/app/app-builder-bot/custom-widget-bot-672b2020d37b7d0b29dcfa71?embed=true"
      width="100%"
    />
  );
};
