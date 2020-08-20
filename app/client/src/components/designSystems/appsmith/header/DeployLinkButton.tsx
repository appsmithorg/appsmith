import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { Icon, Popover, PopoverPosition, Tooltip } from "@blueprintjs/core";
import copy from "copy-to-clipboard";
import { PopoverInteractionKind } from "@blueprintjs/core/lib/esm/components/popover/popover";

const IconContainer = styled.div`
  cursor: pointer;
  margin: 0 10px;
  border: 1px solid #bcccd9;
  border-radius: 50%;
  min-width: 32px;
  max-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  svg {
    transform: rotate(45deg);
  }
`;

const DeployLinkDialog = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 10px;
  width: 336px;
  height: 62px;
  color: #2e3d49;
  flex-direction: row;
`;

const DeployLink = styled.a`
  display: flex;
  cursor: pointer;
  text-decoration: none;
  padding-right: 10px;
  color: #2e3d49;
  :hover {
    text-decoration: none;
    color: #2e3d49;
  }
`;

const DeployUrl = styled.div`
  flex: 1;
  width: 222px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 5px;
`;

type Props = {
  trigger: ReactNode;
  link: string;
};

export const DeployLinkButton = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const link = window.location.origin + props.link;

  const onClose = () => {
    setIsOpen(false);
  };

  const copyToClipboard = () => {
    copy(link);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  return (
    <React.Fragment>
      <Popover
        modifiers={{
          offset: {
            enabled: true,
            offset: "0, 5",
          },
        }}
        content={
          <DeployLinkDialog>
            <Tooltip
              content={isCopied ? "Copied!" : "Copy app publish link"}
              autoFocus={false}
              interactionKind={PopoverInteractionKind.HOVER_TARGET_ONLY}
              lazy
              position={PopoverPosition.BOTTOM}
            >
              <IconContainer onClick={copyToClipboard}>
                <Icon icon="link" color="#BCCCD9" />
              </IconContainer>
            </Tooltip>
            <DeployLink target="_blank" href={props.link}>
              <DeployUrl>
                <span>{link}</span>
              </DeployUrl>
              <Icon icon="share" color={"rgba(0,0,0,0.5)"} />
            </DeployLink>
          </DeployLinkDialog>
        }
        canEscapeKeyClose={false}
        onClose={onClose}
        isOpen={isOpen}
        position={PopoverPosition.BOTTOM}
      >
        <div onClick={() => setIsOpen(true)}>{props.trigger}</div>
      </Popover>
    </React.Fragment>
  );
};

export default DeployLinkButton;
