import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import kebabCase from "lodash/kebabCase";

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
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { EVENTS } from "./customWidgetscript";
import { getAppsmithConfigs } from "ee/configs";
import styles from "./styles.module.css";
import { cssRule, ThemeContext } from "@appsmith/wds-theming";
import { useCustomWidgetHeight } from "./useCustomWidgetHeight";
import type { COMPONENT_SIZE } from "../constants";

const Container = styled.div`
  height: 100%;
  width: 100%;
`;

const { disableIframeWidgetSandbox } = getAppsmithConfigs();

function CustomComponent(props: CustomComponentProps) {
  const { size } = props;
  const iframe = useRef<HTMLIFrameElement>(null);
  const theme = useContext(ThemeContext);
  const { search } = window.location;
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed") === "true";
  const componentHeight = useCustomWidgetHeight(size, isEmbed);
  const [loading, setLoading] = React.useState(true);
  const [isIframeReady, setIsIframeReady] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [height, setHeight] = useState(0);

  const cssTokens = useMemo(() => {
    const tokens = cssRule(theme);
    const prefixedTokens = tokens.replace(/--/g, "--appsmith-theme-");

    return `:root {${prefixedTokens}}`;
  }, [theme]);

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
                ui: {},
                mode: props.renderMode,
                theme,
              },
              "*",
            );

            if (
              props.renderMode === "DEPLOYED" ||
              props.renderMode === "EDITOR"
            ) {
              AnalyticsUtil.logEvent("CUSTOM_WIDGET_LOAD_INIT", {
                widgetId: props.widgetId,
                renderMode: props.renderMode,
              });
            }

            break;
          case EVENTS.CUSTOM_WIDGET_UPDATE_MODEL:
            props.update(message.data);
            break;
          case EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT:
            props.execute(message.data.eventName, message.data.contextObj);
            break;
          case EVENTS.CUSTOM_WIDGET_UPDATE_HEIGHT:
            const height = message.data.height;

            if (props.renderMode !== "BUILDER" && height) {
              iframe.current?.style.setProperty("height", `${height}px`);
              setHeight(height);
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
  }, [props.model]);

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
          type: EVENTS.CUSTOM_WIDGET_THEME_UPDATE,
          theme,
        },
        "*",
      );
    }
  }, [theme, isIframeReady]);

  const srcDoc = `
    <html>
      <head>
        <style>${css}</style>
        <style data-appsmith-theme>${cssTokens}</style>
      </head>
      <body>
        <script type="text/javascript">${
          props.onConsole ? appsmithConsole : ""
        }</script>
        <script type="module">
          ${script}
          main();
        </script>
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
    <Container
      className={clsx(styles.container, {
        "bp3-skeleton": loading,
      })}
      style={{ "--component-height": componentHeight } as React.CSSProperties}
    >
      <iframe
        className={styles.iframe}
        data-size={kebabCase(size)}
        loading="lazy"
        onLoad={() => {
          setLoading(false);
        }}
        ref={iframe}
        sandbox={
          disableIframeWidgetSandbox
            ? undefined
            : "allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-scripts"
        }
        srcDoc={srcDoc}
      />
    </Container>
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
  onLoadingStateChange?: (state: string) => void;
  needsOverlay?: boolean;
  onConsole?: (type: string, message: string) => void;
  renderMode: "EDITOR" | "DEPLOYED" | "BUILDER";
  widgetId: string;
  size?: keyof typeof COMPONENT_SIZE;
}

export default CustomComponent;
