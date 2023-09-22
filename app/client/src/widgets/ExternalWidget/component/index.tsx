import React, { useEffect, useRef } from "react";
import styled from "styled-components";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import script from "!!raw-loader!./script.js";

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
`;

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
        }
      }
    };

    window.addEventListener("message", handler, false);

    return () => window.removeEventListener("message", handler, false);
  }, []);

  useEffect(() => {
    const handler = () => {
      iframe.current?.contentWindow?.postMessage(
        {
          type: "READY",
          model: props.model,
        },
        "*",
      );
    };

    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.addEventListener("load", handler);
    }

    return () => {
      iframe.current?.removeEventListener("load", handler);
    };
  }, []);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.contentWindow.postMessage(
        {
          model: props.model,
        },
        "*",
      );
    }
  }, [props.model]);

  const srcDoc = `
    <html>
      <body>
        <script type="text/javascript">${script}</script>
        ${props.srcDoc.html}
        <script type="text/javascript">${props.srcDoc.js}</script>
        <style>${props.srcDoc.css}</style>
      </body>
    </html>
  `;

  return (
    <div>
      <StyledIframe ref={iframe} sandbox="allow-scripts" srcDoc={srcDoc} />;
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
