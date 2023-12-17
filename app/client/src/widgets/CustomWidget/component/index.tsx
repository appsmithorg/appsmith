import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import script from "!!raw-loader!./customWidgetscript.js";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import appsmithConsole from "!!raw-loader!./appsmithConsole.js";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import css from "!!raw-loader!./reset.css";
import clsx from "clsx";

const StyledIframe = styled.iframe<{ width: number; height: number }>`
  width: ${(props) => props.width - 8}px;
  height: ${(props) => props.height - 8}px;
`;

const OverlayDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const EVENTS = {
  CUSTOM_WIDGET_READY: "CUSTOM_WIDGET_READY",
  CUSTOM_WIDGET_READY_ACK: "CUSTOM_WIDGET_READY_ACK",
  CUSTOM_WIDGET_UPDATE_MODEL: "CUSTOM_WIDGET_UPDATE_MODEL",
  CUSTOM_WIDGET_TRIGGER_EVENT: "CUSTOM_WIDGET_TRIGGER_EVENT",
  CUSTOM_WIDGET_MODEL_CHANGE: "CUSTOM_WIDGET_MODEL_CHANGE",
  CUSTOM_WIDGET_UI_CHANGE: "CUSTOM_WIDGET_UI_CHANGE",
  CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK: "CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK",
};

function CustomComponent(props: CustomComponentProps) {
  const iframe = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = React.useState(true);

  const [isIframeReady, setIsIframeReady] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const iframeWindow =
        iframe.current?.contentWindow ||
        iframe.current?.contentDocument?.defaultView;

      if (event.source === iframeWindow) {
        // Sending acknowledgement for all messages since we're queueing all the postmessage from iframe
        iframe.current?.contentWindow?.postMessage(
          {
            type: EVENTS.CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK,
            key: event.data.key,
            success: true,
          },
          "*",
        );

        const message = event.data;

        switch (message.type) {
          case EVENTS.CUSTOM_WIDGET_READY:
            setIsIframeReady(true);
            iframe.current?.contentWindow?.postMessage(
              {
                type: EVENTS.CUSTOM_WIDGET_READY_ACK,
                model: props.model,
                ui: {
                  width: props.width,
                  height: props.height,
                },
                mode: props.renderMode,
              },
              "*",
            );
            break;
          case EVENTS.CUSTOM_WIDGET_UPDATE_MODEL:
            props.update(message.data);
            break;
          case EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT:
            props.execute(message.data.eventName, message.data.contextObj);
            break;
          case "UPDATE_HEIGHT":
            const height = message.data.height;

            if (height) {
              iframe.current!.style.height = `${height}px`;
            }
            break;
          case "CUSTOM_WIDGET_CONSOLE_EVENT":
            props.onConsole &&
              props.onConsole(message.data.type, message.data.args);
            break;
        }
      }
    };

    window.addEventListener("message", handler, false);

    return () => window.removeEventListener("message", handler, false);
  }, [props.model, props.width, props.height]);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow && isIframeReady) {
      iframe.current.contentWindow.postMessage(
        {
          type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
          model: props.model,
        },
        "*",
      );
    }
  }, [props.model]);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow && isIframeReady) {
      iframe.current.contentWindow.postMessage(
        {
          type: EVENTS.CUSTOM_WIDGET_UI_CHANGE,
          ui: {
            width: props.width,
            height: props.height,
          },
        },
        "*",
      );
    }
  }, [props.width, props.height]);

  const srcDoc = `
    <html>
      <head>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>${css}</style>
      </head>
      <body>
        <script type="text/javascript">${
          props.onConsole ? appsmithConsole : ""
        }</script>
        <script type="module">${script}</script>
        ${props.srcDoc.html}
        <script type="module">
          ${props.srcDoc.js}
        </script>
        <style>${props.srcDoc.css}</style>
      </body>
    </html>
  `;

  useEffect(() => {
    setLoading(true);
  }, [srcDoc]);

  return (
    <div
      className={clsx({
        "bp3-skeleton": loading,
      })}
    >
      {props.needsOverlay && <OverlayDiv data-testid="iframe-overlay" />}
      <StyledIframe
        height={props.height}
        onLoad={() => {
          setLoading(false);
        }}
        ref={iframe}
        sandbox="allow-scripts allow-downloads"
        srcDoc={srcDoc}
        width={props.width}
      />
    </div>
  );
}

export interface CustomComponentProps {
  execute: (eventName: string, contextObj: Record<string, unknown>) => void;
  update: (data: Record<string, unknown>) => void;
  model: Record<string, unknown>;
  srcDoc: {
    html: string;
    js: string;
    css: string;
  };
  width: number;
  height: number;
  onLoadingStateChange?: (state: string) => void;
  needsOverlay?: boolean;
  onConsole?: (type: string, message: string) => void;
  renderMode: "EDITOR" | "DEPLOYED" | "BUILDER";
}

export default CustomComponent;
