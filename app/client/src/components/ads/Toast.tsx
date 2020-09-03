import React from "react";
import { CommonComponentProps, Classes, hexToRgba } from "./common";
import { Variant } from "./Button";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import Text, { TextType } from "./Text";
import { toast, ToastOptions, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Background = "dark" | "light";

type ToastProps = ToastOptions &
  CommonComponentProps & {
    text: string;
    variant?: Variant;
    background?: Background;
    duration: number;
    onUndo?: () => void;
    onComplete?: Function;
  };

const WrappedToastContainer = styled.div`
  .Toastify__toast-container {
    width: auto;
  }
  .Toastify__toast--default {
    background: transparent;
  }
  .Toastify__toast {
    cursor: auto;
    min-height: auto;
    border-radius: 0px !important;
    font-family: ${props => props.theme.fonts.text};
    margin-bottom: ${props => props.theme.spaces[4]}px;
  }
`;
export const StyledToastContainer = (props: ToastOptions) => {
  return (
    <WrappedToastContainer>
      <ToastContainer {...props} />
    </WrappedToastContainer>
  );
};

const bgVariant = (color: string, background?: Background): string => {
  let bgColor = "";
  if (background === "light") {
    bgColor = hexToRgba(color, 0.06);
  } else if (background === "dark") {
    bgColor = hexToRgba(color, 0.1);
  }
  return bgColor;
};

const ToastBody = styled.div<{
  variant?: Variant;
  onUndo?: () => void;
  background?: Background;
}>`
  background-color: ${props =>
    props.variant === Variant.danger
      ? bgVariant(props.theme.colors.toast.dangerColor, props.background)
      : props.variant === Variant.warning
      ? bgVariant(props.theme.colors.toast.warningColor, props.background)
      : props.background === "dark"
      ? props.theme.colors.blackShades[8]
      : props.theme.colors.blackShades[0]};
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[5]}px;
  display: flex;
  align-items: center;

  .${Classes.ICON} {
    cursor: auto;
    margin-right: ${props => props.theme.spaces[3]}px;
    svg {
      path {
        fill: ${props =>
          props.variant === Variant.warning
            ? props.theme.colors.toast.warningColor
            : props.variant === Variant.danger
            ? props.theme.colors.blackShades[9]
            : props.theme.colors.blackShades[6]};
      }
    }
  }

  .${Classes.TEXT} {
    color: ${props =>
      props.variant === Variant.danger
        ? props.theme.colors.toast.dangerColor
        : props.variant === Variant.warning
        ? props.theme.colors.toast.warningColor
        : props.background === "dark"
        ? props.theme.colors.blackShades[0]
        : props.theme.colors.blackShades[7]};
  }

  ${props =>
    props.onUndo
      ? `
    .${Classes.TEXT}:last-child {
      cursor: pointer;
      margin-left: ${props.theme.spaces[3]}px;
      color: ${props.theme.colors.info.main};
    }
    `
      : null}
`;

const ToastComponent = (props: ToastProps) => {
  return (
    <ToastBody
      variant={props.variant}
      onUndo={props.onUndo}
      background={props.background}
    >
      {props.variant === Variant.success ? (
        <Icon name="success" size={IconSize.LARGE} />
      ) : props.variant === Variant.warning ? (
        <Icon name="warning" size={IconSize.LARGE} />
      ) : null}
      {props.variant === Variant.danger ? (
        <Icon name="error" size={IconSize.LARGE} />
      ) : null}
      <Text type={TextType.P1}>{props.text}</Text>
      {props.onUndo ? (
        <Text type={TextType.H6} onClick={() => props.onUndo && props.onUndo()}>
          UNDO
        </Text>
      ) : null}
    </ToastBody>
  );
};

export const Toaster = {
  show: (config: ToastProps) => {
    const toastId = toast(
      <ToastComponent
        {...config}
        onUndo={() => {
          toast.dismiss(toastId);
          config.onUndo && config.onUndo();
        }}
      />,
      {
        pauseOnHover: true,
        autoClose: config.duration,
        closeOnClick: false,
      },
    );
  },
  clear: () => toast.dismiss(),
};
