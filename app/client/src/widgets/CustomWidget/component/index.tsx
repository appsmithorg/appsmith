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
import WidgetStyleContainer from "components/designSystems/appsmith/WidgetStyleContainer";
import type { BoxShadow } from "components/designSystems/appsmith/WidgetStyleContainer";
import type { Color } from "constants/Colors";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
  CUSTOM_WIDGET_THEME_UPDATE: "CUSTOM_WIDGET_THEME_UPDATE",
};

// this is the padding set by the canvas
const WIDGET_PADDING = 8;

function CustomComponent(props: CustomComponentProps) {
  const iframe = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = React.useState(true);

  const [isIframeReady, setIsIframeReady] = useState(false);

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
                ui: {
                  width: props.width - WIDGET_PADDING,
                  height: props.height - WIDGET_PADDING,
                },
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
            width: props.width - 8,
            height: props.height - 8,
          },
        },
        "*",
      );
    }
  }, [props.width, props.height]);

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
    <div
      className={clsx({
        "bp3-skeleton": loading,
      })}
    >
      {props.needsOverlay && <OverlayDiv data-testid="iframe-overlay" />}
      <WidgetStyleContainer
        backgroundColor={props.backgroundColor}
        borderColor={props.borderColor}
        borderRadius={props.borderRadius}
        borderWidth={props.borderWidth}
        boxShadow={props.boxShadow}
        widgetId={props.widgetId}
      >
        <StyledIframe
          height={props.height}
          loading="lazy"
          onLoad={() => {
            setLoading(false);
          }}
          ref={iframe}
          sandbox="allow-scripts allow-downloads"
          srcDoc={srcDoc}
          width={props.width}
        />
      </WidgetStyleContainer>
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
  theme: AppThemeProperties;
  borderColor?: Color;
  backgroundColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  widgetId: string;
}

/**
 * TODO: Balaji soundararajan - to refactor code to move out selected widget details to platform
 */
export const mapStateToProps = (
  state: AppState,
  ownProps: CustomComponentProps,
) => {
  const isPreviewMode = combinedPreviewModeSelector(state);

  return {
    needsOverlay:
      ownProps.renderMode === "EDITOR" &&
      !isPreviewMode &&
      ownProps.widgetId !== getWidgetPropsForPropertyPane(state)?.widgetId,
  };
};

export default connect(mapStateToProps)(CustomComponent);
