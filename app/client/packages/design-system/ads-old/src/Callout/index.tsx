import type { ReactNode } from "react";
import React from "react";
import type { CommonComponentProps } from "../types/common";
import { Classes } from "../constants/classes";
import { Variant } from "../constants/variants";
import styled from "styled-components";
import Icon, { IconSize } from "../Icon";
import Text, { TextType } from "../Text";

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
  padding: var(--ads-spaces-4) var(--ads-spaces-12);
  background: ${(props) =>
    `var(--ads-callout-${props.variant}-background-color)`};

  ${(props) =>
    props.addMarginTop &&
    `
    margin-top: var(--ads-spaces-6);
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
    margin-right: var(--ads-spaces-4);
    svg path {
      fill: ${(props) =>
        props.variant === Variant.danger
          ? "var(--ads-color-black-0)"
          : `var(--ads-callout-${props.variant}-text-color)`};
    }
  }
  a {
    color: ${(props) => `var(--ads-callout-${props.variant}-text-color)`};
    &:hover {
      text-decoration-color: ${(props) =>
        `var(--ads-callout-${props.variant}-text-color)`};
    }
    span {
      color: ${(props) => `var(--ads-callout-${props.variant}-text-color)`};
    }
  }
`;
const Label = styled.div<{ variant: Variant }>`
  position: absolute;
  right: var(--ads-spaces-12);
  .${Classes.ICON} {
    margin-right: 0px !important;
    cursor: pointer;
    svg path {
      fill: ${(props) => `var(--ads-callout-${props.variant}-text-color)`};
    }
  }
`;

Callout.defaultProps = {
  fill: false,
  variant: Variant.info,
};

function Callout(props: CalloutProps) {
  const { onClose } = props;
  return (
    <CalloutContainer
      addMarginTop={props.addMarginTop}
      className={props.className}
      fillUp={props.fill}
      variant={props.variant != null || Variant.info}
    >
      {props.text && props.variant !== Variant.info ? (
        <Icon name={props.variant} size={IconSize.XL} />
      ) : null}
      <Text type={TextType.P2}>{props.text}</Text>
      {props.label ? props.label : null}
      {props.closeButton ? (
        <Label
          onClick={onClose}
          variant={props.variant != null || Variant.info}
        >
          <Icon name="close-modal" size={IconSize.XXL} />
        </Label>
      ) : null}
    </CalloutContainer>
  );
}

export default Callout;
