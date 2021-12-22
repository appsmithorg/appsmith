import { ReactComponent as CheckmarkSvg } from "assets/svg/checkmark.svg";
import styled, { CSSProperties } from "styled-components";
import React from "react";

const CheckmarkWrapper = styled.div<{ $height: string; $width: string }>`
  height: ${(props) => props.$height};
  width: ${(props) => props.$width};
  margin-bottom: ${(props) => props.theme.spaces[15]}px;
  .checkmark .checkmark__circle .checkmark__check {
    animation-delay: 2s;
  }

  .checkmark .checkmark__circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: green;
    fill: none;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark {
    width: ${(props) => props.$height};
    height: ${(props) => props.$width};
    border-radius: 50%;
    display: block;
    stroke-width: 2;
    stroke: green;
    stroke-miterlimit: 10;
    margin: 10% auto;
    box-shadow: inset 0px 0px 0px #7ac142;
    animation: fill 0.4s ease-in-out 0.4s forwards,
      scale 0.3s ease-in-out 0.9s both;
  }

  .checkmark__check {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }
  @keyframes scale {
    0%,
    100% {
      transform: none;
    }
    50% {
      transform: scale3d(1.2, 1.2, 1);
    }
  }
  @keyframes fill {
    100% {
      box-shadow: inset 0px 0px 0px 30px #fff;
    }
  }
`;

function SuccessTick(props: {
  height: string;
  width: string;
  style?: CSSProperties;
}) {
  return (
    <CheckmarkWrapper
      $height={props.height}
      $width={props.width}
      style={props.style}
    >
      <CheckmarkSvg />
    </CheckmarkWrapper>
  );
}

export default SuccessTick;
