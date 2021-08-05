import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { hexToRgba } from "components/ads/common";

interface IframeContainerProps {
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}

export const IframeContainer = styled.div<IframeContainerProps>`
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

export interface IframeComponentProps extends ComponentProps {
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
  } = props;

  const [message, setMessage] = useState("");

  useEffect(() => {
    // add a listener
    window.addEventListener("message", onMessageReceived, false);
    // clean up
    return () =>
      window.removeEventListener("message", onMessageReceived, false);
  }, []);

  useEffect(() => {
    onURLChanged(source);
    if (!source) {
      setMessage("Valid source url is required");
    } else {
      setMessage("");
    }
  }, [source]);

  return (
    <IframeContainer
      borderColor={borderColor}
      borderOpacity={borderOpacity}
      borderWidth={borderWidth}
    >
      {message ? message : <iframe src={source} title={title} />}
    </IframeContainer>
  );
}

export default IframeComponent;
