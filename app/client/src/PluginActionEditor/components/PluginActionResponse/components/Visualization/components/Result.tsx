/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { transform } from "@babel/standalone";
import type { VisualizationElements } from "entities/Action";
import React, { memo, useEffect, useRef, useState } from "react";
// @ts-expect-error - Type error due to raw loader
import customWidgetScript from "!!raw-loader!../../../../../../widgets/CustomWidget/component/customWidgetscript.js";
// @ts-expect-error - Type error due to raw loader
import appsmithConsole from "!!raw-loader!../../../../../../widgets/CustomWidget/component/appsmithConsole.js";
import { EVENTS } from "../../../../../../widgets/CustomWidget/component/customWidgetscript";

interface ResultProps {
  elements: VisualizationElements;
  data: unknown;
}

const theme = {
  primaryColor: "#000000",
  backgroundColor: "#FFFFFF",
  borderRadius: 0,
  boxShadow: "none",
  fontFamily: "Arial",
};

export const Result = memo(({ data, elements }: ResultProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  const compiledJs = transform(elements.js, {
    sourceType: "module",
    presets: ["react"],
    targets: {
      esmodules: true,
    },
  });

  useEffect(
    function setupIframeMessageHandler() {
      const handler = (event: MessageEvent) => {
        const iframeWindow =
          iframeRef.current?.contentWindow ||
          iframeRef.current?.contentDocument?.defaultView;

        if (event.source === iframeWindow) {
          iframeRef.current?.contentWindow?.postMessage(
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
              iframeRef.current?.contentWindow?.postMessage(
                {
                  type: EVENTS.CUSTOM_WIDGET_READY_ACK,
                  model: {
                    data,
                  },
                  ui: {
                    width: 0,
                    height: 0,
                  },
                  theme,
                },
                "*",
              );

              break;
            case "CUSTOM_WIDGET_CONSOLE_EVENT":
              if (message.data.type === "error") {
                throw new Error(message.data.args);
              }

              break;
          }
        }
      };

      window.addEventListener("message", handler, false);

      return () => window.removeEventListener("message", handler, false);
    },
    [data],
  );

  useEffect(
    function updateModel() {
      if (
        iframeRef.current &&
        iframeRef.current.contentWindow &&
        isIframeReady
      ) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
            model: { model: data },
          },
          "*",
        );
      }
    },
    [data],
  );

  const srcDoc = `
    <html>
      <head>
        <style>${elements.css}</style>
      </head>
      <body>
      <script type="text/javascript">${appsmithConsole}</script>
       <script type="module">
        ${customWidgetScript}
        main();
      </script>
        <script type="module">
          ${compiledJs.code}
        </script>
        ${elements.html}
      </body>
    </html>
  `;

  return (
    <iframe
      data-testid="t--visualization-result"
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      srcDoc={srcDoc}
      style={{ width: "100%", height: "100%" }}
    />
  );
});
