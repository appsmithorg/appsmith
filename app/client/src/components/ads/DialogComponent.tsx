import React, { ReactNode, useState, useContext } from "react";
import styled from "styled-components";
import { Dialog, Classes } from "@blueprintjs/core";
import { LayersContext } from "constants/Layers";

const StyledDialog = styled(Dialog)<{
  setMaxWidth?: boolean;
  width?: string;
  maxHeight?: string;
}>`
  && {
    border-radius: ${(props) => props.theme.radii[0]}px;
    padding-bottom: ${(props) => props.theme.spaces[2]};
    background: ${(props) => props.theme.colors.modal.bg};
    ${(props) => (props.maxHeight ? `max-height: ${props.maxHeight};` : "")}
    width: ${(props) => props.width || "640px"};
    ${(props) => props.setMaxWidth && `width: 100vh;`}

    & .${Classes.DIALOG_CLOSE_BUTTON} {
      position: absolute;
      top: ${(props) => props.theme.spaces[4]}px;
      right: ${(props) => props.theme.spaces[4]}px;
    }

    & .${Classes.DIALOG_HEADER} {
      position: relative;
      padding: ${(props) => props.theme.spaces[4]}px;
      background: ${(props) => props.theme.colors.modal.bg};
      box-shadow: none;
      .${Classes.ICON} {
        color: ${(props) => props.theme.colors.modal.iconColor};
      }
      .${Classes.HEADING} {
        color: ${(props) => props.theme.colors.modal.headerText};
        display: flex;
        justify-content: center;
        margin: ${(props) => props.theme.spaces[9]}px;
        font-weight: ${(props) => props.theme.typography.h1.fontWeight};
        font-size: ${(props) => props.theme.typography.h1.fontSize}px;
        line-height: ${(props) => props.theme.typography.h1.lineHeight}px;
        letter-spacing: ${(props) => props.theme.typography.h1.letterSpacing};
      }

      .${Classes.BUTTON}.${Classes.MINIMAL}:hover {
        background-color: ${(props) => props.theme.colors.modal.bg};
      }
    }

    & .${Classes.DIALOG_HEADER}:after {
      content: "";
      width: calc(100% - 40px);
      height: 1px;
      position: absolute;
      background: white;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      background-color: ${(props) => props.theme.colors.modal.separator};
    }

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
  title: string;
  trigger: ReactNode;
  setMaxWidth?: boolean;
  children: ReactNode;
  width?: string;
  maxHeight?: string;
  onOpened?: () => void;
};

export const DialogComponent = (props: DialogComponentProps) => {
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  const onClose = () => {
    setIsOpen(false);
  };

  const Layers = useContext(LayersContext);

  return (
    <React.Fragment>
      <TriggerWrapper
        onClick={() => {
          setIsOpen(true);
        }}
        style={{ zIndex: Layers.max }}
      >
        {props.trigger}
      </TriggerWrapper>
      <StyledDialog
        canOutsideClickClose={!!props.canOutsideClickClose}
        canEscapeKeyClose={false}
        title={props.title}
        onClose={onClose}
        isOpen={isOpen}
        width={props.width}
        setMaxWidth={props.setMaxWidth}
        maxHeight={props.maxHeight}
        onOpened={props.onOpened}
      >
        <div className={Classes.DIALOG_BODY}>{props.children}</div>
      </StyledDialog>
    </React.Fragment>
  );
};

export default DialogComponent;
