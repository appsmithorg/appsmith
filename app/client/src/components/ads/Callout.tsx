import React from "react";
import { CommonComponentProps, Classes } from "./common";
import { Variant } from "./Button";
import Text, { TextType } from "./Text";
import styled from "styled-components";

type CalloutProps = CommonComponentProps & {
  variant: Variant;
  text: string;
};

const CalloutContainer = styled.div<{ variant: Variant }>`
  padding: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
  background: ${props => props.theme.colors[props.variant].darkest};

  .${Classes.TEXT} {
    color: ${props => props.theme.colors[props.variant].main};
  }
`;

function Callout(props: CalloutProps) {
  return (
    <CalloutContainer variant={props.variant}>
      <Text type={TextType.P2}>{props.text}</Text>
    </CalloutContainer>
  );
}

export default Callout;
