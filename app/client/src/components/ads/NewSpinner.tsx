import React from "react";
import styled, { keyframes } from "styled-components";
import { Size, ThemeProp } from "./Button";

export const sizeHandler = (props: ThemeProp & SpinnerProp) => {
  let iconSize = 0;
  switch (props.size) {
    case Size.small:
      iconSize = props.theme.iconSizes.small;
      break;
    case Size.medium:
      iconSize = props.theme.iconSizes.medium;
      break;
    case Size.large:
      iconSize = props.theme.iconSizes.large;
      break;
  }
  return iconSize;
};

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

const SvgContainer = styled("svg")<SpinnerProp>`
  animation: ${rotate} 2s linear infinite;
  width: ${props => sizeHandler(props)}px;
  height: ${props => sizeHandler(props)}px;
`;

const SvgCircle = styled("circle")`
  stroke: white;
  stroke-linecap: round;
  animation: ${dash} 1.5s ease-in-out infinite;
  stroke-width: ${props => props.theme.spaces[1]}px;
`;

export type SpinnerProp = {
  size?: Size;
};

NewSpinner.defaultProp = {
  size: "small",
};

export default function NewSpinner(props: SpinnerProp) {
  return (
    <SvgContainer viewBox="0 0 50 50" className="new-spinner" size={props.size}>
      <SvgCircle cx="25" cy="25" r="20" fill="none"></SvgCircle>
    </SvgContainer>
  );
}
