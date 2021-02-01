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
    <React.Fragment>
      <Popover
        modifiers={{ offset: { enabled: true, offset: "0, -3" } }}
        content={
          <DeployLinkDialog>
            <DeployLink target="_blank" href={props.link}>
              <DeployUrl>Current deployed version</DeployUrl>
              <Icon
                icon="share"
                color={props.theme.colors.header.deployToolTipText}
              />
            </DeployLink>
          </DeployLinkDialog>
        }
        canEscapeKeyClose={false}
        onClose={onClose}
        isOpen={isOpen}
        position={PopoverPosition.BOTTOM_RIGHT}
      >
        <div onClick={() => setIsOpen(true)}>{props.trigger}</div>
      </Popover>
    </React.Fragment>
  );
});

export default DeployLinkButton;
