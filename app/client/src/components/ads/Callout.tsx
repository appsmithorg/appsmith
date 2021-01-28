import React, { ReactNode } from "react";
import { CommonComponentProps, Classes, Variant } from "./common";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import { Colors } from "constants/Colors";
import Text, { TextType } from "./Text";

type CalloutProps = CommonComponentProps & {
  variant?: Variant;
  fill?: boolean;
  closeButton?: boolean;
  text?: string;
  label?: ReactNode;
  onClose?: () => void;
};

const CalloutContainer = styled.div<{
  variant: Variant;
  fill?: boolean;
}>`
  position: relative;
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[12]}px;
  background: ${(props) => props.theme.colors.callout[props.variant].bgColor};

  ${(props) =>
    props.fill
      ? `
  display: flex;
  align-items: center;
  justify-content: center;
  `
      : null};

  .${Classes.ICON} {
    cursor: default;
    margin-right: ${(props) => props.theme.spaces[4]}px;
    svg path {
      fill: ${(props) =>
        props.variant === Variant.danger
          ? Colors.WHITE
          : props.theme.colors.callout[props.variant].color};
    }
  }
  a {
    color: ${(props) => props.theme.colors.callout[props.variant].color};
    &:hover {
      text-decoration-color: ${(props) =>
        props.theme.colors.callout[props.variant].color};
    }
    span {
      color: ${(props) => props.theme.colors.callout[props.variant].color};
    }
  }
`;
const Label = styled.div<{ variant: Variant }>`
  position: absolute;
  right: ${(props) => props.theme.spaces[12]}px;
  top: ${(props) => props.theme.spaces[5]}px;
  .${Classes.ICON} {
    margin-right: 0px !important;
    cursor: pointer;
    svg path {
      fill: ${(props) => props.theme.colors.callout[props.variant].color};
    }
  }
`;

Callout.defaultProps = {
  fill: false,
  variant: Variant.info,
};

function Callout(props: CalloutProps) {
  return (
    <CalloutContainer variant={props.variant || Variant.info} fill={props.fill}>
      {props.text && props.variant !== Variant.info ? (
        <Icon name={props.variant} size={IconSize.MEDIUM} />
      ) : null}
      <Text type={TextType.P2}>{props.text}</Text>
      {props.label ? props.label : null}
      {props.closeButton ? (
        <Label variant={props.variant || Variant.info} onClick={props.onClose}>
          <Icon name="close-modal" />
        </Label>
      ) : null}
    </CalloutContainer>
  );
}

export default Callout;
