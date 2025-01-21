import React from "react";
import { Button, Menu, MenuContent, MenuTrigger, Tooltip } from "@appsmith/ads";
import { useToggle } from "@mantine/hooks";
import {
  createMessage,
  ENTITY_MORE_ACTIONS_TOOLTIP,
} from "ee/constants/messages";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";

interface Props {
  menuContent?: React.ReactNode[] | React.ReactNode;
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
        {props.menuContent}
      </MenuContent>
    </Menu>
  );
};

export default EntityContextMenu;
