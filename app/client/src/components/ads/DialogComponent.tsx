import React, { ReactNode, useState, useEffect } from "react";
import styled from "styled-components";
import { Dialog, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import Icon, { IconName, IconSize } from "./Icon";

const StyledDialog = styled(Dialog)<{
  setMaxWidth?: boolean;
  width?: string;
  maxHeight?: string;
  maxWidth?: string;
  showHeaderUnderline?: boolean;
}>`
  && {
    border-radius: 0;
    padding: 24px;
    background: ${(props) => props.theme.colors.modal.bg};
    ${(props) => (props.maxHeight ? `max-height: ${props.maxHeight};` : "")}
    width: ${(props) => props.width || "640px"};
    ${(props) => props.setMaxWidth && `width: 100vh;`}
    ${(props) => props.maxWidth && `max-width: ${props.maxWidth};`}

    & .${Classes.DIALOG_HEADER} {
      position: relative;
      padding: 0px;
      padding-bottom: 0;
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
      font-weight: ${(props) => props.theme.typography.h1.fontWeight};
      font-size: ${(props) => props.theme.typography.h1.fontSize}px;
      line-height: ${(props) => props.theme.typography.h1.lineHeight}px;
      letter-spacing: ${(props) => props.theme.typography.h1.letterSpacing};
    }

    .${Classes.DIALOG_CLOSE_BUTTON} {
      color: ${Colors.CHARCOAL};
      min-width: 0;
      padding: 0;

      svg {
        fill: ${Colors.CHARCOAL};
        width: 24px;
        height: 24px;
      }
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
      margin: 0;
      margin-top: 24px;
      overflow: auto;
    }

    & .${Classes.DIALOG_FOOTER_ACTIONS} {
      display: block;
    }
  }
`;

const HeaderIconWrapper = styled.div<{ bgColor?: string }>`
  padding: 5px;
  border-radius: 50%;
  margin-right: 10px;
  background: ${(props) => props.bgColor || props.theme.colors.modal.iconBg};
`;

type DialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  title?: string;
  headerIcon?: {
    clickable?: boolean;
    name: IconName;
    fillColor?: string;
    hoverColor?: string;
    bgColor?: string;
  };
  trigger?: ReactNode;
  setMaxWidth?: boolean;
  children: ReactNode;
  width?: string;
  maxHeight?: string;
  onOpening?: () => void;
  onClose?: () => void;
  setModalClose?: (close: boolean) => void;
  triggerZIndex?: number;
  showHeaderUnderline?: boolean;
  getHeader?: () => ReactNode;
  canEscapeKeyClose?: boolean;
  className?: string;
  maxWidth?: string;
};

export function DialogComponent(props: DialogComponentProps) {
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  const { onClose: onCloseProp, setModalClose } = props;
  const onClose = () => {
    setModalClose ? setModalClose(false) : null;
    setIsOpen(false);
    onCloseProp && onCloseProp();
  };

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

  const getHeader = props.getHeader;
  const headerIcon = props.headerIcon ? (
    <HeaderIconWrapper bgColor={props.headerIcon.bgColor}>
      <Icon
        clickable={props.headerIcon?.clickable}
        fillColor={props.headerIcon.fillColor}
        hoverFillColor={props.headerIcon.hoverColor}
        name={props.headerIcon.name}
        size={IconSize.XL}
      />
    </HeaderIconWrapper>
  ) : null;

  return (
    <>
      {props.trigger && (
        <div
          className="ads-dialog-trigger"
          onClick={() => {
            setIsOpen(true);
          }}
          style={{ zIndex: props.triggerZIndex }}
        >
          {props.trigger}
        </div>
      )}
      <StyledDialog
        canEscapeKeyClose={!!props.canEscapeKeyClose}
        canOutsideClickClose={!!props.canOutsideClickClose}
        className={props.className}
        icon={headerIcon}
        isOpen={isOpen}
        maxHeight={props.maxHeight}
        maxWidth={props.maxWidth}
        onClose={onClose}
        onOpening={props.onOpening}
        setMaxWidth={props.setMaxWidth}
        showHeaderUnderline={props.showHeaderUnderline}
        title={props.title}
        width={props.width}
      >
        {getHeader && getHeader()}
        <div className={Classes.DIALOG_BODY}>{props.children}</div>
      </StyledDialog>
    </>
  );
}

export default DialogComponent;
