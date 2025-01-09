import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// Scripts and styles will be loaded differently in ShadowDOM implementation
import clsx from "clsx";
import type { AppThemeProperties } from "entities/AppTheming";
import WidgetStyleContainer from "components/designSystems/appsmith/WidgetStyleContainer";
import type { BoxShadow } from "components/designSystems/appsmith/WidgetStyleContainer";
import type { Color } from "constants/Colors";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { EVENTS } from "./customWidgetscript";
import { DynamicHeight } from "utils/WidgetFeatures";
import { getIsAutoHeightWithLimitsChanging } from "utils/hooks/autoHeightUIHooks";
import { GridDefaults } from "constants/WidgetConstants";
import { LayoutSystemTypes } from "layoutSystems/types";

const ShadowContainer = styled.div<{
  componentWidth: number;
  componentHeight: number;
  componentMinHeight: number;
}>`
  width: ${(props) => props.componentWidth}px;
  height: ${(props) => props.componentHeight}px;
  min-height: ${(props) => props.componentMinHeight}px;
  position: relative;
`;

const OverlayDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const Container = styled.div`
  height: 100%;
  width: 100%;
`;

// Shadow DOM doesn't need sandbox configuration

function CustomComponent(props: CustomComponentProps) {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [isShadowRootReady, setIsShadowRootReady] = useState(false);
  const [height, setHeight] = useState(props.height);

  // Initialize shadow root
  useEffect(() => {
    if (shadowHostRef.current && !shadowHostRef.current.shadowRoot) {
      shadowHostRef.current.attachShadow({ mode: "open" });
      setIsShadowRootReady(true);
      setLoading(false);
    }
  }, [shadowHostRef]);

  const theme = useMemo(() => {
    return {
      ...props.theme?.colors,
      borderRadius: props.theme?.borderRadius?.appBorderRadius,
      boxShadow: props.theme?.boxShadow?.appBoxShadow,
    };
  }, [props.theme]);

  // Initialize widget when shadow root is ready
  useEffect(() => {
    if (isShadowRootReady && shadowHostRef.current?.shadowRoot) {
      // Signal widget is ready
      setLoading(false);

      // Initialize with current model and UI state
      if (props.renderMode === "DEPLOYED" || props.renderMode === "EDITOR") {
        AnalyticsUtil.logEvent("CUSTOM_WIDGET_LOAD_INIT", {
          widgetId: props.widgetId,
          renderMode: props.renderMode,
        });
      }
    }
  }, [isShadowRootReady, props.widgetId, props.renderMode]);

  // Handle custom widget events
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      if (!e.detail) return;

      switch (e.detail.type) {
        case EVENTS.CUSTOM_WIDGET_UPDATE_MODEL:
          props.update(e.detail.data);
          break;
        case EVENTS.CUSTOM_WIDGET_TRIGGER_EVENT:
          props.execute(e.detail.data.eventName, e.detail.data.contextObj);
          break;
        case EVENTS.CUSTOM_WIDGET_UPDATE_HEIGHT:
          if (
            props.renderMode !== "BUILDER" &&
            e.detail.data.height &&
            (props.dynamicHeight !== DynamicHeight.FIXED ||
              props.layoutSystemType === LayoutSystemTypes.AUTO)
          ) {
            setHeight(e.detail.data.height);
          }

          break;
        case "CUSTOM_WIDGET_CONSOLE_EVENT":
          props.onConsole?.(e.detail.data.type, e.detail.data.args);
          break;
      }
    };

    if (shadowHostRef.current?.shadowRoot) {
      shadowHostRef.current.shadowRoot.addEventListener(
        "custom-widget-event",
        handleCustomEvent as EventListener,
      );
    }

    return () => {
      if (shadowHostRef.current?.shadowRoot) {
        shadowHostRef.current.shadowRoot.removeEventListener(
          "custom-widget-event",
          handleCustomEvent as EventListener,
        );
      }
    };
  }, [props, props.dynamicHeight, props.layoutSystemType]);

  // Update model when it changes
  useEffect(() => {
    if (isShadowRootReady && shadowHostRef.current?.shadowRoot) {
      const event = new CustomEvent("model-update", {
        detail: { model: props.model },
        bubbles: true,
        composed: true,
      });

      shadowHostRef.current.shadowRoot.dispatchEvent(event);
    }
  }, [props.model, isShadowRootReady]);

  // Update UI dimensions when they change
  useEffect(() => {
    if (isShadowRootReady && shadowHostRef.current?.shadowRoot) {
      const event = new CustomEvent("ui-update", {
        detail: { width: props.width, height },
        bubbles: true,
        composed: true,
      });

      shadowHostRef.current.shadowRoot.dispatchEvent(event);

      if (
        props.dynamicHeight === DynamicHeight.FIXED &&
        props.layoutSystemType === LayoutSystemTypes.FIXED
      ) {
        setHeight(props.height);
      }
    }
  }, [
    props.width,
    height,
    props.dynamicHeight,
    props.height,
    props.layoutSystemType,
    isShadowRootReady,
  ]);

  // Update theme when it changes
  useEffect(() => {
    if (isShadowRootReady && shadowHostRef.current?.shadowRoot) {
      const event = new CustomEvent("theme-update", {
        detail: { theme },
        bubbles: true,
        composed: true,
      });

      shadowHostRef.current.shadowRoot.dispatchEvent(event);
    }
  }, [theme, isShadowRootReady]);

  // Inject content into shadow root
  useEffect(() => {
    if (isShadowRootReady && shadowHostRef.current?.shadowRoot) {
      const shadowRoot = shadowHostRef.current.shadowRoot;

      // Clear existing content
      while (shadowRoot.firstChild) {
        shadowRoot.removeChild(shadowRoot.firstChild);
      }

      // Add CSS
      const styleEl = document.createElement("style");

      styleEl.textContent = props.srcDoc.css;
      shadowRoot.appendChild(styleEl);

      // Add HTML content
      const contentEl = document.createElement("div");

      contentEl.innerHTML = props.srcDoc.html;
      shadowRoot.appendChild(contentEl);

      // Add JavaScript
      const scriptEl = document.createElement("script");

      scriptEl.type = "module";
      scriptEl.textContent = `
        // Initialize custom widget API
        window.customWidget = {
          triggerEvent: (eventName, contextObj) => {
            const event = new CustomEvent("custom-widget-event", {
              detail: {
                type: "CUSTOM_WIDGET_TRIGGER_EVENT",
                data: { eventName, contextObj }
              },
              bubbles: true,
              composed: true
            });
            document.dispatchEvent(event);
          },
          updateModel: (data) => {
            const event = new CustomEvent("custom-widget-event", {
              detail: {
                type: "CUSTOM_WIDGET_UPDATE_MODEL",
                data
              },
              bubbles: true,
              composed: true
            });
            document.dispatchEvent(event);
          },
          updateHeight: (height) => {
            const event = new CustomEvent("custom-widget-event", {
              detail: {
                type: "CUSTOM_WIDGET_UPDATE_HEIGHT",
                data: { height }
              },
              bubbles: true,
              composed: true
            });
            document.dispatchEvent(event);
          }
        };

        // User's JavaScript
        ${props.srcDoc.js}
      `;
      shadowRoot.appendChild(scriptEl);
    }
  }, [isShadowRootReady, props.srcDoc]);

  return (
    <Container
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
        <ShadowContainer
          componentHeight={height}
          componentMinHeight={
            props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS
              ? props.minDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT
              : 0
          }
          componentWidth={props.width}
          ref={shadowHostRef}
        />
      </WidgetStyleContainer>
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
  dynamicHeight: DynamicHeight;
  minDynamicHeight: number;
  layoutSystemType?: LayoutSystemTypes;
}

/**
 * TODO: Balaji soundararajan - to refactor code to move out selected widget details to platform
 */
export const mapStateToProps = (
  state: AppState,
  ownProps: CustomComponentProps,
) => {
  const isPreviewMode = selectCombinedPreviewMode(state);

  return {
    needsOverlay:
      (ownProps.renderMode === "EDITOR" &&
        !isPreviewMode &&
        ownProps.widgetId !== getWidgetPropsForPropertyPane(state)?.widgetId) ||
      getIsAutoHeightWithLimitsChanging(state),
  };
};

export default connect(mapStateToProps)(CustomComponent);
