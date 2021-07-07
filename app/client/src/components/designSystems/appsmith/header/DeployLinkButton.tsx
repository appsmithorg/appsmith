import React, { ReactNode, useState } from "react";
import styled, { withTheme } from "styled-components";
import { Icon, Popover, PopoverPosition } from "@blueprintjs/core";
import { Theme } from "constants/DefaultTheme";

const DeployLinkDialog = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: ${(props) =>
    props.theme.colors.header.deployToolTipBackground};
  flex-direction: row;
`;

const DeployLink = styled.a`
  display: flex;
  cursor: pointer;
  text-decoration: none;
  color: ${(props) => props.theme.colors.header.deployToolTipText};
  :hover {
    text-decoration: underline;
    color: ${(props) => props.theme.colors.header.deployToolTipText};
  }
`;

const DeployUrl = styled.div`
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 5px;
`;

type Props = {
  trigger: ReactNode;
  link: string;
  theme: Theme;
};

export const DeployLinkButton = withTheme((props: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <Popover
      canEscapeKeyClose={false}
      content={
        <DeployLinkDialog>
          <DeployLink href={props.link} target="_blank">
            <DeployUrl>Current deployed version</DeployUrl>
            <Icon
              color={props.theme.colors.header.deployToolTipText}
              icon="share"
            />
          </DeployLink>
        </DeployLinkDialog>
      }
      isOpen={isOpen}
      modifiers={{ offset: { enabled: true, offset: "0, -3" } }}
      onClose={onClose}
      position={PopoverPosition.BOTTOM_RIGHT}
    >
      <div onClick={() => setIsOpen(true)}>{props.trigger}</div>
    </Popover>
  );
});

export default DeployLinkButton;
