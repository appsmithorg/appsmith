import React from "react";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextType } from "./Text";
import styled from "styled-components";

export type Variant = "note" | "warning";
export type Background = "dark" | "light";

type CalloutProps = CommonComponentProps & {
  variant?: Variant;
  background?: Background;
  text: string;
  fill?: boolean;
};

const CalloutContainer = styled.div<{
  variant?: Variant;
  fill?: boolean;
  background?: Background;
}>`
  padding: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[11] + 1}px;
  background: ${props =>
    props.variant && props.background
      ? props.theme.colors.callout[props.variant][props.background].bgColor
      : null};
  height: 42px;

  ${props =>
    props.fill
      ? `
  display: flex;
  align-items: center;
  justify-content: center;
  `
      : null};

  .${Classes.TEXT} {
    color: ${props =>
      props.variant && props.background
        ? props.theme.colors.callout[props.variant][props.background].color
        : null};
  }
`;

Callout.defaultProps = {
  fill: false,
  variant: "note",
  background: "dark",
};

function Callout(props: CalloutProps) {
  return (
    <CalloutContainer
      variant={props.variant}
      background={props.background}
      fill={props.fill}
    >
      <Text type={TextType.P2}>{props.text}</Text>
    </CalloutContainer>
  );
}

export default Callout;
