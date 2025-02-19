import React from "react";
import { Button, Menu, MenuContent, MenuTrigger, Tooltip } from "@appsmith/ads";
import { useToggle } from "@mantine/hooks";
import {
  createMessage,
  ENTITY_MORE_ACTIONS_TOOLTIP,
} from "ee/constants/messages";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";

interface Props {
  children: React.ReactNode[] | React.ReactNode;
  dataTestId?: string;
}

const EntityContextMenu = (props: Props) => {
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);

  return (
    <Menu onOpenChange={toggleMenuOpen} open={isMenuOpen}>
      <MenuTrigger className="t--context-menu">
        <div className="relative">
          <Tooltip
            content={createMessage(ENTITY_MORE_ACTIONS_TOOLTIP)}
            isDisabled={isMenuOpen}
            mouseLeaveDelay={0}
            placement="right"
          >
            <Button
              className={EntityClassNames.CONTEXT_MENU}
              data-testid={props.dataTestId}
              isIconButton
              kind="tertiary"
              startIcon="more-2-fill"
            />
          </Tooltip>
        </div>
      </MenuTrigger>
      <MenuContent
        align="start"
        className={`t--entity-context-menu ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
        side="right"
        style={{ maxHeight: "unset" }}
        width="220px"
      >
        {props.children}
      </MenuContent>
    </Menu>
  );
};

export default EntityContextMenu;
