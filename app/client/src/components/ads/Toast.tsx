import React from "react";
import { CommonComponentProps, Classes, Variant } from "./common";
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
    duration?: number;
    onUndo?: () => void;
    onComplete?: Function;
    undoAction?: () => void;
  };

const WrappedToastContainer = styled.div`
  .Toastify__toast-container {
    width: auto;
    padding: 0px;
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

const ToastBody = styled.div<{
  variant?: Variant;
  onUndo?: () => void;
  background?: Background;
}>`
  background: ${props =>
    props.background
      ? props.variant === Variant.danger
        ? props.theme.colors.toast[props.background].dangerBg
        : props.variant === Variant.warning
        ? props.theme.colors.toast[props.background].warningBg
        : props.theme.colors.toast[props.background].infoBg
      : null};
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
          props.variant === Variant.warning && props.background
            ? props.theme.colors.toast[props.background].warningColor
            : props.variant === Variant.danger && props.background
            ? "#FFFFFF"
            : props.theme.colors.blackShades[6]};
      }
      rect {
        ${props =>
          props.variant === Variant.danger && props.background
            ? `fill: ${props.theme.colors.toast[props.background].dangerColor}`
            : null};
      }
    }
  }

  .${Classes.TEXT} {
    color: ${props =>
      props.background
        ? props.variant === Variant.danger
          ? props.theme.colors.toast[props.background].dangerColor
          : props.variant === Variant.warning
          ? props.theme.colors.toast[props.background].warningColor
          : props.theme.colors.toast[props.background].infoColor
        : null};
  }

  ${props =>
    props.onUndo && props.background
      ? `
    .${Classes.TEXT}:last-child {
      cursor: pointer;
      margin-left: ${props.theme.spaces[3]}px;
      color: ${props.theme.colors.toast[props.background].undo};
    }
    `
      : null}
`;

const ToastComponent = (props: ToastProps) => {
  return (
    <ToastBody
      variant={props.variant || Variant.info}
      onUndo={props.onUndo}
      background={props.background || "light"}
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
        <Text
          type={TextType.H6}
          onClick={() => props.undoAction && props.undoAction()}
        >
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
        undoAction={() => {
          toast.dismiss(toastId);
          config.onUndo && config.onUndo();
        }}
        {...config}
      />,
      {
        pauseOnHover: true,
        autoClose: config.duration || 5000,
        closeOnClick: false,
      },
    );
  },
  clear: () => toast.dismiss(),
};
