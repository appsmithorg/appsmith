import React from "react";
import { CommonComponentProps, Classes } from "./common";
import { Variant } from "./Button";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import Text, { TextType } from "./Text";
import { toast, ToastOptions, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ToastProps = ToastOptions &
  CommonComponentProps & {
    text: string;
    variant?: Variant;
    duration: number;
    pauseOnHover?: boolean;
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
    border-radius: 0px;
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

const ToastBody = styled.div<{ variant?: Variant; onUndo?: () => void }>`
  background-color: ${props =>
    props.variant === Variant.danger
      ? props.theme.colors.message.dangerBackground
      : props.variant === Variant.warning
      ? props.theme.colors.message.warningBackground
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
            ? props.theme.colors.message.warningColor
            : props.theme.colors.blackShades[9]};
      }
    }
  }

  .${Classes.TEXT} {
    color: ${props =>
      props.variant === Variant.danger
        ? props.theme.colors.message.dangerColor
        : props.variant === Variant.warning
        ? props.theme.colors.message.warningColor
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
    <ToastBody variant={props.variant} onUndo={props.onUndo}>
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
        pauseOnHover: config.pauseOnHover,
        autoClose: config.duration,
        closeOnClick: false,
      },
    );
  },
  clear: () => toast.dismiss(),
};
