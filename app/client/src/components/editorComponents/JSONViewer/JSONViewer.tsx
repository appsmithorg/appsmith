import React from "react";
import type { JSONViewerProps } from "./types";
import ReactJson from "react-json-view";
import * as Styled from "./styles";
import { FontSize, IconSize, reactJsonProps } from "./constants";

export function JSONViewer(props: JSONViewerProps) {
  const fontSize = FontSize[props.size];
  const iconSize = IconSize[props.size];

  return (
    <Styled.Container $fontSize={fontSize} $iconSize={iconSize}>
      <ReactJson src={props.src} {...reactJsonProps} />
    </Styled.Container>
  );
}
