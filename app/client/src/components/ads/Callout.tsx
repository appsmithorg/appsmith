import React from "react";
import { CommonComponentProps, Classes, Variant } from "./common";
import Text, { TextType } from "./Text";
import styled from "styled-components";

type CalloutProps = CommonComponentProps & {
  variant?: Variant;
  text: string;
  fill?: boolean;
};

const CalloutContainer = styled.div<{
  variant?: Variant;
  fill?: boolean;
}>`
  padding: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[11] + 1}px;
  background: ${props =>
    props.variant ? props.theme.colors.callout[props.variant].bgColor : null};
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
      props.variant ? props.theme.colors.callout[props.variant].color : null};
  }
`;

Callout.defaultProps = {
  fill: false,
  variant: "note",
};

function Callout(props: CalloutProps) {
  return (
    <CalloutContainer variant={props.variant} fill={props.fill}>
      <Text type={TextType.P2}>{props.text}</Text>
    </CalloutContainer>
  );
}

export default Callout;
