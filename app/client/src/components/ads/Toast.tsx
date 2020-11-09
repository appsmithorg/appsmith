import React from "react";
import { CommonComponentProps, Classes, Variant } from "./common";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import Text, { TextType } from "./Text";
import { toast, ToastOptions, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReduxActionType } from "constants/ReduxActionConstants";
import { useDispatch } from "react-redux";

type ToastProps = ToastOptions &
  CommonComponentProps & {
    text: string;
    variant?: Variant;
    duration?: number;
    onUndo?: () => void;
    undoAction?: () => void;
    dispatchableAction?: { type: ReduxActionType; payload: any };
    hideProgressBar?: boolean;
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
  dispatchableAction?: { type: ReduxActionType; payload: any };
}>`
  background: ${props =>
    props.variant === Variant.danger
      ? props.theme.colors.toast.dangerBg
      : props.variant === Variant.warning
      ? props.theme.colors.toast.warningBg
      : props.theme.colors.toast.infoBg};
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
            ? "#FFFFFF"
            : "#9F9F9F"};
      }
      rect {
        ${props =>
          props.variant === Variant.danger
            ? `fill: ${props.theme.colors.toast.dangerColor}`
            : null};
      }
    }
  }

  .${Classes.TEXT} {
    color: ${props =>
      props.variant === Variant.danger
        ? props.theme.colors.toast.dangerColor
        : props.variant === Variant.warning
        ? props.theme.colors.toast.warningColor
        : props.theme.colors.toast.infoColor};
  }

  ${props =>
    props.onUndo || props.dispatchableAction
      ? `
    .${Classes.TEXT}:last-child {
      cursor: pointer;
      margin-left: ${props.theme.spaces[3]}px;
      color: ${props.theme.colors.toast.undo};
    }
    `
      : null}
`;

const ToastComponent = (props: ToastProps) => {
  const dispatch = useDispatch();

  return (
    <ToastBody
      variant={props.variant || Variant.info}
      onUndo={props.onUndo}
      dispatchableAction={props.dispatchableAction}
      className="t--toast-action"
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
      {props.onUndo || props.dispatchableAction ? (
        <Text
          type={TextType.H6}
          onClick={() => {
            if (props.dispatchableAction) {
              dispatch(props.dispatchableAction);
              props.undoAction && props.undoAction();
            } else {
              props.undoAction && props.undoAction();
            }
          }}
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
        hideProgressBar: config.hideProgressBar,
      },
    );
  },
  clear: () => toast.dismiss(),
};
