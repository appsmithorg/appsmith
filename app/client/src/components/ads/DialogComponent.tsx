import React, { ReactNode, useState, useContext } from "react";
import styled from "styled-components";
import { Dialog, Classes } from "@blueprintjs/core";
import { LayersContext } from "constants/Layers";

const StyledDialog = styled(Dialog)<{
  setMaxWidth?: boolean;
  width?: number;
  maxHeight?: string;
}>`
  && {
    border-radius: 0px;
    padding-bottom: 5px;
    background: ${(props) => props.theme.colors.modal.bg};
    width: ${(props) => `${props.width}px` || "640px"};
    ${(props) => (props.maxHeight ? `max-height: ${props.maxHeight};` : "")}

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
        margin-top: 20px;
        font-size: 20px;
        line-height: 24px;
        font-weight: 500;
      }

      .${Classes.BUTTON}.${Classes.MINIMAL}:hover {
        background-color: ${(props) => props.theme.colors.modal.bg};
      }
    }

    & .${Classes.DIALOG_HEADER}:after {
      content: "";
      width: 80%;
      height: 1px;
      position: absolute;
      background: white;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      background-color: ${(props) => props.theme.colors.modal.separator}
    }
    & .${Classes.DIALOG_BODY} {
      padding: ${(props) => props.theme.spaces[9]}px;
      margin: 0;
      overflow: auto;
    }
    & .${Classes.DIALOG_FOOTER_ACTIONS} {
      display: block;
    }
    ${(props) => props.setMaxWidth && `width: 100vh;`}
  }
`;

const TriggerWrapper = styled.div``;

type DialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  orgId?: string;
  title: string;
  Form?: any;
  trigger: ReactNode;
  permissionRequired?: string;
  permissions?: string[];
  setMaxWidth?: boolean;
  applicationId?: string;
  children?: any;
  width?: number;
  maxHeight?: string;
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
      >
        <div className={Classes.DIALOG_BODY}>{props.children}</div>
      </StyledDialog>
    </React.Fragment>
  );
};

export default DialogComponent;
