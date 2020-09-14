import React from "react";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextType } from "./Text";
import styled from "styled-components";

export type Variant = "note" | "warning";

type CalloutProps = CommonComponentProps & {
  variant: Variant;
  text: string;
  fill?: boolean;
};

const CalloutContainer = styled.div<{ variant: Variant; fill?: boolean }>`
  padding: ${props => props.theme.spaces[6]}px
    ${props => props.theme.spaces[11] + 1}px ${props => props.theme.spaces[5]}px;
  background: ${props => props.theme.colors.callout[props.variant].bgColor};
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
    color: ${props => props.theme.colors.callout[props.variant].color};
  }
`;

Callout.defaultProps = {
  fill: false,
};

function Callout(props: CalloutProps) {
  return (
    <CalloutContainer variant={props.variant} fill={props.fill}>
      <Text type={TextType.P2}>{props.text}</Text>
    </CalloutContainer>
  );
}

export default Callout;
