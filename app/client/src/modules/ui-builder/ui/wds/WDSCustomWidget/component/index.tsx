import clsx from "clsx";
import kebabCase from "lodash/kebabCase";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { cssRule, ThemeContext } from "@appsmith/wds-theming";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import styles from "./styles.module.css";
import { EVENTS } from "./customWidgetscript";
import { getAppsmithConfigs } from "ee/configs";
import { getSandboxPermissions } from "../helpers";
import type { CustomComponentProps } from "../types";
import { createHtmlTemplate } from "./createHtmlTemplate";
import { IframeMessenger } from "../services/IframeMessenger";
import { useCustomWidgetHeight } from "./useCustomWidgetHeight";

const { disableIframeWidgetSandbox } = getAppsmithConfigs();

function CustomComponent(props: CustomComponentProps) {
  const { model, onConsole, onTriggerEvent, onUpdateModel, renderMode, size } =
    props;
  const iframe = useRef<HTMLIFrameElement>(null);
  const theme = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const messenger = useRef<IframeMessenger | null>(null);
  const componentHeight = useCustomWidgetHeight(size);

  const cssTokens = useMemo(() => {
    const tokens = cssRule(theme);
    const prefixedTokens = tokens.replace(/--/g, "--appsmith-theme-");

    return `:root {${prefixedTokens}}`;
  }, [theme]);

  useEffect(
    // The iframe sends messages to the parent window (main Appsmith application)
    // to communicate with it. We need to set up a listener for these messages
    // and handle them appropriately.
    function setupIframeMessageHandler() {
      if (!iframe.current) return;

      messenger.current = new IframeMessenger(iframe.current);

      const messageHandlers = {
        [EVENTS.CUSTOM_WIDGET_READY]: handleWidgetReady,
        [EVENTS.CUSTOM_WIDGET_UPDATE_MODEL]: handleModelUpdate,
        [EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT]: handleTriggerEvent,
        [EVENTS.CUSTOM_WIDGET_UPDATE_HEIGHT]: handleHeightUpdate,
        [EVENTS.CUSTOM_WIDGET_CONSOLE_EVENT]: handleConsoleEvent,
      };

      const handler = (event: MessageEvent) => {
        messenger.current?.handleMessage(event, messageHandlers);
      };

      window.addEventListener("message", handler, false);

      return () => window.removeEventListener("message", handler, false);
    },
    [model],
  );

  const handleWidgetReady = () => {
    setIsIframeReady(true);

    messenger.current?.postMessage({
      type: EVENTS.CUSTOM_WIDGET_READY_ACK,
      model: props.model,
      mode: props.renderMode,
    });

    logInitializationEvent();
  };

  const handleModelUpdate = (message: Record<string, unknown>) => {
    onUpdateModel(message.model as Record<string, unknown>);
  };

  const handleTriggerEvent = (message: Record<string, unknown>) => {
    onTriggerEvent(
      message.eventName as string,
      message.contextObj as Record<string, unknown>,
    );
  };

  const handleHeightUpdate = (message: Record<string, unknown>) => {
    const height = message.height;

    if (props.renderMode !== "BUILDER" && height) {
      iframe.current?.style.setProperty("height", `${height}px`);
    }
  };

  const handleConsoleEvent = (eventData: Record<string, unknown>) => {
    if (!onConsole) return;

    onConsole(eventData.type as string, eventData.args as string);
  };

  const logInitializationEvent = () => {
    if (renderMode === "DEPLOYED" || renderMode === "EDITOR") {
      AnalyticsUtil.logEvent("CUSTOM_WIDGET_LOAD_INIT", {
        widgetId: props.widgetId,
        renderMode: props.renderMode,
      });
    }
  };

  useEffect(
    function handleModelChange() {
      if (iframe.current && iframe.current.contentWindow && isIframeReady) {
        messenger.current?.postMessage({
          type: EVENTS.CUSTOM_WIDGET_MODEL_CHANGE,
          model: model,
        });
      }
    },
    [model],
  );

  useEffect(
    function handleThemeUpdate() {
      if (iframe.current && iframe.current.contentWindow && isIframeReady) {
        messenger.current?.postMessage({
          type: EVENTS.CUSTOM_WIDGET_THEME_UPDATE,
          theme,
        });
      }
    },
    [theme, isIframeReady],
  );

  const srcDoc = createHtmlTemplate({
    cssTokens,
    onConsole: !!props.onConsole,
    srcDoc: props.srcDoc,
  });

  return (
    <div
      className={clsx(styles.container, { "bp3-skeleton": loading })}
      style={{ "--component-height": componentHeight } as React.CSSProperties}
    >
      <iframe
        className={styles.iframe}
        data-size={kebabCase(props.size)}
        loading="lazy"
        onLoad={() => setLoading(false)}
        ref={iframe}
        sandbox={getSandboxPermissions(disableIframeWidgetSandbox)}
        srcDoc={srcDoc}
      />
    </Container>
  );
}

export default CustomComponent;
