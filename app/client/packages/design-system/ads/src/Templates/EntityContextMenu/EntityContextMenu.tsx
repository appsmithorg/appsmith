import React from "react";
import { useToggle } from "usehooks-ts";

import { Button } from "../../Button";
import { Menu, MenuTrigger } from "../../Menu";
import { Tooltip } from "../../Tooltip";

import { EntityClassNames } from "./constants";
import * as Styled from "./EntityContextMenu.styles";

interface Props {
  children?: React.ReactNode[] | React.ReactNode;
  tooltipContent: React.ReactNode;
}

export const EntityContextMenu = (props: Props) => {
  const { children, tooltipContent } = props;
  const [isMenuOpen, toggleMenuOpen] = useToggle();

  return (
    <Menu onOpenChange={toggleMenuOpen} open={isMenuOpen}>
      <MenuTrigger className="t--context-menu">
        <Styled.ButtonContainer>
          <Tooltip
            content={tooltipContent}
            isDisabled={isMenuOpen}
            mouseLeaveDelay={0}
            placement="right"
          >
            <Button
              className={EntityClassNames.CONTEXT_MENU}
              data-testid="t--more-action-trigger"
              isIconButton
              kind="tertiary"
              startIcon="more-2-fill"
            />
          </Tooltip>
        </Styled.ButtonContainer>
      </MenuTrigger>
      <Styled.MenuContent
        align="start"
        className={`t--entity-context-menu ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
        side="right"
      >
        {children}
      </Styled.MenuContent>
    </Menu>
  );
};
