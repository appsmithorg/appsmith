import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { hexToRgba } from "widgets/WidgetUtils";

import { ComponentProps } from "widgets/BaseComponent";
import { useSelector } from "store";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { RenderMode } from "constants/WidgetConstants";

interface IframeContainerProps {
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
  borderRadius: string;
  boxShadow?: string;
}

export const IframeContainer = styled.div<IframeContainerProps>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-weight: bold;

  iframe {
    width: 100%;
    height: 100%;
    border-style: solid;
    border-color: ${(props) =>
      hexToRgba(
        props.borderColor || props.theme.colors.border,
        (props.borderOpacity && !isNaN(props.borderOpacity)
          ? props.borderOpacity
          : 100) / 100,
      )};
    border-width: ${(props) =>
      props.borderWidth ? Number(props.borderWidth) : 0}px;
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  }
`;

const OverlayDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

export interface IframeComponentProps extends ComponentProps {
  renderMode: RenderMode;
  source: string;
  srcDoc?: string;
  title?: string;
  onURLChanged: (url: string) => void;
  onSrcDocChanged: (srcDoc?: string) => void;
  onMessageReceived: (message: MessageEvent) => void;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
  borderRadius: string;
  boxShadow?: string;
}

function IframeComponent(props: IframeComponentProps) {
  const {
    borderColor,
    borderOpacity,
    borderWidth,
    onMessageReceived,
    onSrcDocChanged,
    onURLChanged,
    source,
    srcDoc,
    title,
    widgetId,
  } = props;

  const frameRef = useRef<HTMLIFrameElement>(null);

  const isFirstSrcURLRender = useRef(true);
  const isFirstSrcDocRender = useRef(true);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const iframeWindow =
        frameRef.current?.contentWindow ||
        frameRef.current?.contentDocument?.defaultView;
      // Accept messages only from the current iframe
      if (event.source !== iframeWindow) return;
      onMessageReceived(event);
    };
    // add a listener
    window.addEventListener("message", handler, false);
    // clean up
    return () => window.removeEventListener("message", handler, false);
  }, []);

  useEffect(() => {
    if (isFirstSrcURLRender.current) {
      isFirstSrcURLRender.current = false;
      return;
    }
    onURLChanged(source);
    if (source || srcDoc) {
      setMessage("");
    } else {
      setMessage("Valid source URL is required");
    }
  }, [source]);

  useEffect(() => {
    if (isFirstSrcDocRender.current) {
      isFirstSrcDocRender.current = false;
      return;
    }
    onSrcDocChanged(srcDoc);
    if (srcDoc || source) {
      setMessage("");
    } else {
      setMessage("At least either of source URL or srcDoc is required");
    }
  }, [srcDoc]);

  const appMode = useSelector(getAppMode);
  const selectedWidget = useSelector(getWidgetPropsForPropertyPane);

  return (
    <IframeContainer
      borderColor={borderColor}
      borderOpacity={borderOpacity}
      borderRadius={props.borderRadius}
      borderWidth={borderWidth}
      boxShadow={props.boxShadow}
    >
      {appMode === APP_MODE.EDIT && widgetId !== selectedWidget?.widgetId && (
        <OverlayDiv />
      )}

      {message ? (
        message
      ) : srcDoc ? (
        <iframe
          allow="camera; microphone"
          ref={frameRef}
          src={source}
          srcDoc={srcDoc}
          title={title}
        />
      ) : (
        <iframe
          allow="camera; microphone"
          ref={frameRef}
          src={source}
          title={title}
        />
      )}
    </IframeContainer>
  );
}

export default IframeComponent;
