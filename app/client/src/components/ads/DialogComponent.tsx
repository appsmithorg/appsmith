import React, { ReactNode, useState, useEffect } from "react";
import styled from "styled-components";
import { Dialog, Classes } from "@blueprintjs/core";

const StyledDialog = styled(Dialog)<{
  setMaxWidth?: boolean;
  width?: string;
  maxHeight?: string;
  showHeaderUnderline?: boolean;
}>`
  && {
    border-radius: 0;
    padding-bottom: ${(props) => props.theme.spaces[2]}px;
    background: ${(props) => props.theme.colors.modal.bg};
    ${(props) => (props.maxHeight ? `max-height: ${props.maxHeight};` : "")}
    width: ${(props) => props.width || "640px"};
    ${(props) => props.setMaxWidth && `width: 100vh;`}

    & .${Classes.DIALOG_HEADER} {
      position: relative;
      padding: ${(props) => props.theme.spaces[4]}px;
      background: ${(props) => props.theme.colors.modal.bg};
      box-shadow: none;
      .${Classes.ICON} {
        color: ${(props) => props.theme.colors.modal.iconColor};
      }

      .${Classes.BUTTON}.${Classes.MINIMAL}:hover {
        background-color: ${(props) => props.theme.colors.modal.bg};
      }
    }

    .${Classes.HEADING} {
      color: ${(props) => props.theme.colors.modal.headerText};
      display: flex;
      justify-content: center;
      margin-top: ${(props) => props.theme.spaces[9]}px;
      font-weight: ${(props) => props.theme.typography.h1.fontWeight};
      font-size: ${(props) => props.theme.typography.h1.fontSize}px;
      line-height: ${(props) => props.theme.typography.h1.lineHeight}px;
      letter-spacing: ${(props) => props.theme.typography.h1.letterSpacing};
    }

    ${(props) =>
      props.showHeaderUnderline
        ? `
        & .${Classes.DIALOG_HEADER}:after {
          content: "";
          width: calc(100% - 40px);
          height: 1px;
          position: absolute;
          background: white;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          background-color: ${props.theme.colors.modal.separator};
        }

        .${Classes.HEADING} {
          margin-bottom: ${props.theme.spaces[7]}px;
        }
      `
        : ""}

    & .${Classes.DIALOG_BODY} {
      padding: ${(props) => props.theme.spaces[9]}px;
      margin: 0;
      overflow: auto;
    }

    & .${Classes.DIALOG_FOOTER_ACTIONS} {
      display: block;
    }
  }
`;

const TriggerWrapper = styled.div``;

type DialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  title?: string;
  trigger: ReactNode;
  setMaxWidth?: boolean;
  children: ReactNode;
  width?: string;
  maxHeight?: string;
  onOpening?: () => void;
  triggerZIndex?: number;
  showHeaderUnderline?: boolean;
  getHeader?: () => ReactNode;
  canEscapeKeyClose?: boolean;
  className?: string;
};

export const DialogComponent = (props: DialogComponentProps) => {
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  const onClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

  const getHeader = props.getHeader;

  return (
    <React.Fragment>
      <TriggerWrapper
        className="ads-dialog-trigger"
        onClick={() => {
          setIsOpen(true);
        }}
        style={{ zIndex: props.triggerZIndex }}
      >
        {props.trigger}
      </TriggerWrapper>
      <StyledDialog
        canOutsideClickClose={!!props.canOutsideClickClose}
        canEscapeKeyClose={!!props.canEscapeKeyClose}
        title={props.title}
        onClose={onClose}
        isOpen={isOpen}
        width={props.width}
        setMaxWidth={props.setMaxWidth}
        maxHeight={props.maxHeight}
        onOpening={props.onOpening}
        showHeaderUnderline={props.showHeaderUnderline}
        className={props.className}
      >
        {getHeader && getHeader()}
        <div className={Classes.DIALOG_BODY}>{props.children}</div>
      </StyledDialog>
    </React.Fragment>
  );
};

export default DialogComponent;
