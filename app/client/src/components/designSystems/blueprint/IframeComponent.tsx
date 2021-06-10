import React, { useEffect } from "react";
import styled from "styled-components";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { hexToRgba } from "components/ads/common";

function Iframe(props: IframeComponentProps) {
  return <iframe {...props} src={props.source} />;
}

export const IframeWithBorder = styled(Iframe)<IframeComponentProps>`
  width: 100%;
  height: 100%;
  border-color: ${(props) =>
    hexToRgba(
      props.borderColor || "#f2f2f2",
      (props.borderOpacity && !isNaN(props.borderOpacity)
        ? props.borderOpacity
        : 100) / 100,
    )};
  border-width: ${(props) =>
    props.borderWidth ? Number(props.borderWidth) : 0}px;
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
  const { onMessageReceived, onURLChanged, source } = props;

  useEffect(() => {
    // add a listener
    window.addEventListener("message", onMessageReceived, false);
    // clean up
    return () =>
      window.removeEventListener("message", onMessageReceived, false);
  }, []);

  useEffect(() => {
    onURLChanged(source);
  }, [source]);

  return <IframeWithBorder {...props} />;
}

export default IframeComponent;
