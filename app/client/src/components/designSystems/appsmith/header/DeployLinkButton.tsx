import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { Icon, Popover, PopoverPosition } from "@blueprintjs/core";

const IconContainer = styled.div`
  margin: 0 10px;
  border: 1px solid #bcccd9;
  border-radius: 50%;
  min-width: 32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`;

const DeployLinkDialog = styled.a`
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 10px;
  width: 336px;
  height: 60px;
  cursor: pointer;
  text-decoration: none;
  color: #2e3d49;
  :hover {
    text-decoration: none;
    color: #2e3d49;
  }
`;

const DeployUrl = styled.div`
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type Props = {
  trigger: ReactNode;
  link: string;
};

export const DeployLinkButton = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
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
          <DeployLinkDialog target="_blank" href={props.link}>
            <IconContainer>
              <Icon icon="link" color="#BCCCD9" />
            </IconContainer>
            <DeployUrl>
              {window.location.origin}
              {props.link}
            </DeployUrl>
            <Icon icon="share" color={"rgba(0,0,0,0.5)"} />
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
