import React from "react";
import {
  CommonComponentProps,
  Classes,
  Variant,
  ToastTypeOptions,
} from "./common";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import Text, { TextType } from "./Text";
import { toast, ToastOptions, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReduxActionType } from "constants/ReduxActionConstants";
import { useDispatch } from "react-redux";
import { Colors } from "constants/Colors";
import DebugButton from "components/editorComponents/Debugger/DebugCTA";
import * as log from "loglevel";

export type ToastProps = ToastOptions &
  CommonComponentProps & {
    contentClassName?: string;
    text: string;
    actionElement?: JSX.Element;
    variant?: Variant;
    duration?: number;
    onUndo?: () => void;
    dispatchableAction?: { type: ReduxActionType; payload: any };
    showDebugButton?: boolean;
    hideProgressBar?: boolean;
    hideActionElementSpace?: boolean;
    width?: string;
    maxWidth?: string;
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
    font-family: ${(props) => props.theme.fonts.text};
    margin-bottom: ${(props) => props.theme.spaces[4]}px;
  }
  .Toastify__toast-container--top-right {
    top: 8em;
  }
`;
export function StyledToastContainer(props: ToastOptions) {
  return (
    <WrappedToastContainer>
      <ToastContainer {...props} />
    </WrappedToastContainer>
  );
}

const ToastBody = styled.div<{
  variant?: Variant;
  isUndo?: boolean;
  dispatchableAction?: { type: ReduxActionType; payload: any };
  width?: string;
  maxWidth?: string;
}>`
  width: ${(props) => props.width || "fit-content"};
  max-width: ${(props) => props.maxWidth || "264px"};
  margin-left: auto;
  background: ${(props) => props.theme.colors.toast.bg};
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[5]}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  // Using word-break here, as overflow-wrap: anywhere
  // has no effect in safari
  word-break: break-word;
  overflow-wrap: anywhere;

  div > .${Classes.ICON} {
    cursor: auto;
    margin-right: ${(props) => props.theme.spaces[3]}px;
    margin-top: ${(props) => props.theme.spaces[1] / 2}px;
    svg {
      path {
        fill: ${(props) =>
          props.variant === Variant.warning
            ? props.theme.colors.toast.warningColor
            : props.variant === Variant.danger
            ? "#FFFFFF"
            : "#9F9F9F"};
      }
      rect {
        ${(props) =>
          props.variant === Variant.danger
            ? `fill: ${props.theme.colors.toast.dangerColor}`
            : null};
      }
    }
  }

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.toast.textColor};
  }

  ${(props) =>
    props.isUndo || props.dispatchableAction
      ? `
    .undo-section .${Classes.TEXT} {
      cursor: pointer;
      margin-left: ${props.theme.spaces[3]}px;
      color: ${props.theme.colors.toast.undo};
      line-height: 18px;
      font-weight: 600;
      white-space: nowrap
    }
    `
      : null}
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 1;
`;

const ToastTextWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledDebugButton = styled(DebugButton)`
  margin-left: auto;
`;

const StyledActionText = styled(Text)`
  color: ${(props) => props.theme.colors.toast.undoRedoColor} !important;
  cursor: pointer;
  margin-left: ${(props) => props.theme.spaces[3]}px;
`;

export function ToastComponent(
  props: ToastProps & { undoAction?: () => void },
) {
  const dispatch = useDispatch();

  return (
    <ToastBody
      className="t--toast-action"
      dispatchableAction={props.dispatchableAction}
      isUndo={!!props.onUndo}
      maxWidth={props.maxWidth}
      variant={props.variant || Variant.info}
      width={props.width}
    >
      <FlexContainer style={{ minWidth: 0 }}>
        {props.variant === Variant.success ? (
          <Icon fillColor={Colors.GREEN} name="success" size={IconSize.XXL} />
        ) : props.variant === Variant.warning ? (
          <Icon name="warning" size={IconSize.XXL} />
        ) : null}
        {props.variant === Variant.danger ? (
          <Icon name="error" size={IconSize.XXL} />
        ) : null}
        <ToastTextWrapper>
          <Text className={props.contentClassName} type={TextType.P1}>
            {props.text}
          </Text>
          {props.actionElement && (
            <StyledActionText type={TextType.P1}>
              {!props.hideActionElementSpace ? <>&nbsp;</> : ""}
              {props.actionElement}
            </StyledActionText>
          )}
          {props.variant === Variant.danger && props.showDebugButton ? (
            <StyledDebugButton
              className="t--toast-debug-button"
              source={"TOAST"}
            />
          ) : null}
        </ToastTextWrapper>
      </FlexContainer>
      <div className="undo-section">
        {props.onUndo || props.dispatchableAction ? (
          <Text
            onClick={() => {
              if (props.dispatchableAction) {
                dispatch(props.dispatchableAction);
                props.undoAction && props.undoAction();
              } else {
                props.undoAction && props.undoAction();
              }
            }}
            type={TextType.H6}
          >
            UNDO
          </Text>
        ) : null}
      </div>
    </ToastBody>
  );
}

export const Toaster = {
  show: (config: ToastProps) => {
    if (typeof config.text !== "string") {
      log.error("Toast message needs to be a string");
      return;
    }
    if (config.variant && !Object.values(Variant).includes(config.variant)) {
      log.error(
        "Toast type needs to be a one of " +
          Object.values(ToastTypeOptions).join(", "),
      );
      return;
    }
    // Stringified JSON is a long, but valid key :shrug:
    const toastId = JSON.stringify(config);
    toast(
      <ToastComponent
        undoAction={() => {
          toast.dismiss(toastId);
          config.onUndo && config.onUndo();
        }}
        {...config}
      />,
      {
        toastId: toastId,
        pauseOnHover: !config.dispatchableAction && !config.hideProgressBar,
        pauseOnFocusLoss: !config.dispatchableAction && !config.hideProgressBar,
        autoClose: false,
        closeOnClick: true,
        hideProgressBar: config.hideProgressBar,
      },
    );
    // Update autoclose everytime to keep resetting the timer.
    toast.update(toastId, {
      autoClose: config.duration || 5000,
    });
  },
  clear: () => toast.dismiss(),
};
