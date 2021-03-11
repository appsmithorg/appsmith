import React from "react";
import styled, { keyframes } from "styled-components";
import { sizeHandler, IconSize } from "./Icon";
import { Classes } from "./common";

const rotate = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

const dash = keyframes`
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
`;

const SvgContainer = styled.svg<SpinnerProp>`
  animation: ${rotate} 2s linear infinite;
  width: ${(props) => sizeHandler(props.size)}px;
  height: ${(props) => sizeHandler(props.size)}px;
`;

const SvgCircle = styled.circle`
  stroke: ${(props) => props.theme.colors.spinner};
  stroke-linecap: round;
  animation: ${dash} 1.5s ease-in-out infinite;
  stroke-width: ${(props) => props.theme.spaces[1]}px;
`;

export type SpinnerProp = {
  size?: IconSize;
};

Spinner.defaultProp = {
  size: "small",
};

export default function Spinner(props: SpinnerProp) {
  return (
    <SvgContainer
      className={Classes.SPINNER}
      size={props.size}
      viewBox="0 0 50 50"
    >
      <SvgCircle cx="25" cy="25" fill="none" r="20" />
    </SvgContainer>
  );
}
