import React, { useEffect, useRef } from "react";
import styled from "styled-components";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import script from "!!raw-loader!./script.js";

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

function CustomComponent(props: CustomComponentProps) {
  const iframe = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const iframeWindow =
        iframe.current?.contentWindow ||
        iframe.current?.contentDocument?.defaultView;

      if (event.source === iframeWindow) {
        const message = event.data;

        if (message.type === "UPDATE") {
          props.update(message.data);
        } else if (message.type === "EVENT") {
          props.execute(message.data.eventName, message.data.contextObj);
        } else if (message.type === "READY") {
          iframe.current?.contentWindow?.postMessage(
            {
              type: "READY_ACK",
              model: props.model,
              dimensions: {
                width: props.width,
                height: props.height,
              },
            },
            "*",
          );
        } else if (message.type === "UPDATE_HEIGHT") {
          const height = message.data.height;

          if (height) {
            iframe.current!.style.height = `${height}px`;
          }
        }
      }
    };

    window.addEventListener("message", handler, false);

    return () => window.removeEventListener("message", handler, false);
  }, []);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.contentWindow.postMessage(
        {
          type: "MODEL_UPDATE",
          model: props.model,
        },
        "*",
      );
    }
  }, [props.model]);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.contentWindow.postMessage(
        {
          type: "UI_UPDATE",
          dimensions: {
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
        <script type="text/javascript">${script}</script>
        ${props.srcDoc.html}
        <script type="text/babel"  data-presets="react" data-type="module">
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
        sandbox="allow-scripts"
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
}

export default CustomComponent;
