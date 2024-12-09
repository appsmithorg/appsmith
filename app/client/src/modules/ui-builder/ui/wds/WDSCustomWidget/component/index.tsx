import clsx from "clsx";
import kebabCase from "lodash/kebabCase";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { cssRule, ThemeContext } from "@appsmith/wds-theming";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import styles from "./styles.module.css";
import { EVENTS } from "./customWidgetscript";
import { getAppsmithConfigs } from "ee/configs";
import { getSandboxPermissions } from "../helpers";
import { createHtmlTemplate } from "./createHtmlTemplate";
import type { CustomWidgetComponentProps } from "../types";
import { IframeMessenger } from "../services/IframeMessenger";
import { useCustomWidgetHeight } from "./useCustomWidgetHeight";

const { disableIframeWidgetSandbox } = getAppsmithConfigs();

export function CustomWidgetComponent(props: CustomWidgetComponentProps) {
  const { model, onConsole, onTriggerEvent, onUpdateModel, renderMode, size } =
    props;
  const iframe = useRef<HTMLIFrameElement>(null);
  const theme = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const messenger = useRef<IframeMessenger | null>(null);
  const componentHeight = useCustomWidgetHeight(size);

  // We want to pass anvil theme css variables the iframe so that it looks like a anvil theme. To do, we are
  // generating the css variables from the anvil theme and then sending it to the iframe. See the
  // createHtmlTemplate.tsx file where we are using the cssTokens.
  const cssTokens = useMemo(() => {
    const tokens = cssRule(theme);
    const prefixedTokens = tokens.replace(/--/g, "--appsmith-theme-");

    return `:root {${prefixedTokens}}`;
  }, [theme]);

  useEffect(
    // The iframe sends messages to the parent window (main Appsmith application)
    // to communicate with it. Here we set up a listener for these messages
    // and handle them appropriately.
    function setupIframeMessageHandler() {
      if (!iframe.current) return;

      messenger.current = new IframeMessenger(iframe.current);

      const messageHandlers = {
        [EVENTS.CUSTOM_WIDGET_READY]: handleIframeOnLoad,
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

  // the iframe sends CUSTOM_WIDGET_READY message when "onload" event is triggered
  // on the iframe's window object
  const handleIframeOnLoad = () => {
    setIsIframeReady(true);

    messenger.current?.postMessage({
      type: EVENTS.CUSTOM_WIDGET_READY_ACK,
      model: props.model,
      mode: props.renderMode,
    });

    logInitializationEvent();
  };

  // the iframe can make changes to the model, when it needs to
  // this is done by sending a CUSTOM_WIDGET_UPDATE_MODEL message to the parent window
  const handleModelUpdate = (message: Record<string, unknown>) => {
    onUpdateModel(message.model as Record<string, unknown>);
  };

  // the iframe elements can trigger events. Triggered events here would mean
  // executing an appsmith action. When the iframe elements want to execute an action,
  // it sends a CUSTOM_WIDGET_TRIGGER_EVENT message to the parent window.
  const handleTriggerEvent = (message: Record<string, unknown>) => {
    onTriggerEvent(
      message.eventName as string,
      message.contextObj as Record<string, unknown>,
    );
  };

  // iframe content can change its height based on its content. When this happens,
  // we want to update the height of the iframe so that it is same as the iframe content's height.
  // To do this, we listen to CUSTOM_WIDGET_UPDATE_HEIGHT messages from the iframe and update the height of the iframe
  const handleHeightUpdate = (message: Record<string, unknown>) => {
    const height = message.height;

    if (props.renderMode !== "BUILDER" && height) {
      iframe.current?.style.setProperty("height", `${height}px`);
    }
  };

  // we intercept console function calls in the iframe and send them to the parent window
  // so that they can be logged in the console of the main Appsmith application
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
    // iframe can listen to changes to model with `appsmith.onModelChange` function.
    // To do this, we send a CUSTOM_WIDGET_MODEL_CHANGE message to the iframe
    // when the model changes. Iframe would be listening to these messages and
    // when it receives one, it calls all the callbacks that were registered
    // with `appsmith.onModelChange` function
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
    // similar to model change, iframe can listen to changes to theme with
    // `appsmith.onThemeChange` function.
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

  useEffect(
    // Everytime srcDoc changes, we want to set loading to true, so that all iframe events are reset
    function handleIframeLoad() {
      setLoading(true);
    },
    [srcDoc],
  );

  return (
    <div
      className={clsx(styles.container, { "bp3-skeleton": loading })}
      style={{ "--component-height": componentHeight } as React.CSSProperties}
    >
      <iframe
        className={styles.iframe}
        data-size={kebabCase(props.size)}
        loading="lazy"
        onLoad={() => {
          setLoading(false);
        }}
        ref={iframe}
        sandbox={getSandboxPermissions(disableIframeWidgetSandbox)}
        srcDoc={srcDoc}
      />
    </div>
  );
}
