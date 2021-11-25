import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { hexToRgba } from "widgets/WidgetUtils";

import { ComponentProps } from "widgets/BaseComponent";
import { useSelector } from "store";
import { RenderMode } from "constants/WidgetConstants";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";

interface IframeContainerProps {
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}

export const IframeContainer = styled.div<IframeContainerProps>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #ffffff;
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
  title?: string;
  onURLChanged: (url: string) => void;
  onMessageReceived: (message: MessageEvent) => void;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}

function IframeComponent(props: IframeComponentProps) {
  const {
    borderColor,
    borderOpacity,
    borderWidth,
    onMessageReceived,
    onURLChanged,
    source,
    title,
    widgetId,
  } = props;

  const isFirstRender = useRef(true);

  const [message, setMessage] = useState("");

  useEffect(() => {
    // add a listener
    window.addEventListener("message", onMessageReceived, false);
    // clean up
    return () =>
      window.removeEventListener("message", onMessageReceived, false);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onURLChanged(source);
    if (!source) {
      setMessage("Valid source url is required");
    } else {
      setMessage("");
    }
  }, [source]);

  const appMode = useSelector(getAppMode);
  const selectedWidget = useSelector(getWidgetPropsForPropertyPane);

  return (
    <IframeContainer
      borderColor={borderColor}
      borderOpacity={borderOpacity}
      borderWidth={borderWidth}
    >
      {appMode === APP_MODE.EDIT && widgetId !== selectedWidget?.widgetId && (
        <OverlayDiv />
      )}

      {message ? message : <iframe src={source} title={title} />}
    </IframeContainer>
  );
}

export default IframeComponent;
