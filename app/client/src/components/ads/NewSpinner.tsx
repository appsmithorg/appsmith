import React from "react";
import styled, { keyframes } from "styled-components";

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
  z-index: 2;
  width: ${props => spinnerSize(props)}px;
  height: ${props => spinnerSize(props)}px;
`;

const SvgCircle = styled("circle")`
  stroke: white;
  stroke-linecap: round;
  animation: ${dash} 1.5s ease-in-out infinite;
  stroke-width: 5px;
`;

const spinnerSize = (props: SpinnerProp) => {
  let iconSize: number;
  switch (props.size) {
    case "small":
      iconSize = 11;
      break;
    case "medium":
      iconSize = 13;
      break;
    default:
      iconSize = 14;
      break;
  }
  return iconSize;
};

export type SpinnerProp = {
  size?: "small" | "medium" | "large";
};

NewSpinner.defaultProp = {
  size: "small",
};

export default function NewSpinner(props: SpinnerProp) {
  return (
    <SvgContainer className="new-spinner" viewBox="0 0 50 50" size={props.size}>
      <SvgCircle cx="25" cy="25" r="20" fill="none"></SvgCircle>
    </SvgContainer>
  );
}
