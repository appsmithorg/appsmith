import React, { useEffect, useRef } from "react";
import styled from "styled-components";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import script from "!!raw-loader!./script.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import css from "!!raw-loader!./reset.css";

const StyledIframe = styled.iframe`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ExternalComponent(props: any) {
  const iframe = useRef<HTMLIFrameElement>(null);

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

  return (
    <div>
      <StyledIframe
        height={props.height}
        ref={iframe}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        width={props.width}
      />
    </div>
  );
}

export interface ExternalComponentProps {
  execute: (eventName: string, contextObj: Record<string, unknown>) => void;
  update: (data: Record<string, unknown>) => void;
  model: Record<string, unknown>;
  srcDoc: string;
}

export default ExternalComponent;
