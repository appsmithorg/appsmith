import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { AppThemeProperties } from "entities/AppTheming";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { EVENTS } from "./customWidgetscript";
import { getAppsmithConfigs } from "ee/configs";
import { Elevations } from "../../constants";
import { ContainerComponent } from "../../Container";
import styles from "./styles.module.css";

const Container = styled.div`
  height: 100%;
  width: 100%;
`;

const { disableIframeWidgetSandbox } = getAppsmithConfigs();

function CustomComponent(props: CustomComponentProps) {
  const iframe = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = React.useState(true);

  const [isIframeReady, setIsIframeReady] = useState(false);

  const [height, setHeight] = useState(0);

  const theme = useMemo(() => {
    return {
      ...props.theme?.colors,
      borderRadius: props.theme?.borderRadius?.appBorderRadius,
      boxShadow: props.theme?.boxShadow?.appBoxShadow,
    };
  }, [props.theme]);

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
          type: EVENTS.CUSTOM_WIDGET_UI_CHANGE,
          ui: {
            height: height,
          },
        },
        "*",
      );
    }
  }, [height]);

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
  }, [theme]);

  const srcDoc = `
    <html>
      <head>
        <style>${css}</style>
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
      className={clsx({
        "bp3-skeleton": loading,
      })}
    >
      <ContainerComponent
        elevatedBackground={props.elevatedBackground}
        elevation={Elevations.CARD_ELEVATION}
        noPadding
        widgetId={props.widgetId}
      >
        <iframe
          className={styles.iframe}
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
      </ContainerComponent>
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
  theme: AppThemeProperties;
  widgetId: string;
  elevatedBackground: boolean;
}

export default CustomComponent;
