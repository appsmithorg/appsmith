import React, { ReactNode } from "react";
import { CommonComponentProps, Classes, Variant } from "./common";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Icon, IconSize, Text, TextType } from "design-system";

export type CalloutProps = CommonComponentProps & {
  variant?: Variant;
  fill?: boolean;
  closeButton?: boolean;
  text?: string;
  label?: ReactNode;
  addMarginTop?: boolean;
  onClose?: () => void;
};

const CalloutContainer = styled.div<{
  variant: Variant;
  fillUp?: boolean;
  addMarginTop?: boolean;
}>`
  position: relative;
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[12]}px;
  background: ${(props) => props.theme.colors.callout[props.variant].bgColor};

  ${(props) =>
    props.addMarginTop &&
    `
    margin-top: ${props.theme.spaces[6]}px;
  `}

  ${(props) =>
    props.fillUp
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
    <CalloutContainer
      addMarginTop={props.addMarginTop}
      className={props.className}
      fillUp={props.fill}
      variant={props.variant || Variant.info}
    >
      {props.text && props.variant !== Variant.info ? (
        <Icon name={props.variant} size={IconSize.XL} />
      ) : null}
      <Text type={TextType.P2}>{props.text}</Text>
      {props.label ? props.label : null}
      {props.closeButton ? (
        <Label onClick={props.onClose} variant={props.variant || Variant.info}>
          <Icon name="close-modal" size={IconSize.XXL} />
        </Label>
      ) : null}
    </CalloutContainer>
  );
}

export default Callout;
