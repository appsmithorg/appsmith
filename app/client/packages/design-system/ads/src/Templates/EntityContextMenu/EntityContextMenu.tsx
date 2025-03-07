import React from "react";
import { useToggle } from "usehooks-ts";

import { Button } from "../../Button";
import { Menu, MenuTrigger } from "../../Menu";
import { Tooltip } from "../../Tooltip";

import {
  EntityClassNames,
  DEFAULT_DATA_TEST_ID,
  DEFAULT_TOOLTIP_CONTENT,
} from "./constants";

import * as Styled from "./EntityContextMenu.styles";

interface Props {
  dataTestId?: string;
  children: React.ReactNode[] | React.ReactNode;
  tooltipContent?: React.ReactNode;
}

export const EntityContextMenu = (props: Props) => {
  const {
    children,
    dataTestId = DEFAULT_DATA_TEST_ID,
    tooltipContent = DEFAULT_TOOLTIP_CONTENT,
  } = props;

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
              data-testid={dataTestId}
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
