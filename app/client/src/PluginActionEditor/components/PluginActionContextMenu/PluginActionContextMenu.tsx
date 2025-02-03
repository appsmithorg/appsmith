import React from "react";
import { Button, Menu, MenuTrigger } from "@appsmith/ads";
import { useToggle } from "@mantine/hooks";
import { usePluginActionContext } from "../../PluginActionContext";
import * as Styled from "./styles";

interface Props {
  menuContent: React.ReactNode;
}

export function PluginActionContextMenu(props: Props) {
  const { action } = usePluginActionContext();
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);

  return (
    <Menu onOpenChange={toggleMenuOpen} open={isMenuOpen}>
      <MenuTrigger>
        <Button
          data-testid="t--more-action-trigger"
          isIconButton
          kind="tertiary"
          size="sm"
          startIcon="more-2-fill"
        />
      </MenuTrigger>
      <Styled.MenuContent key={action.id} loop width="204px">
        {props.menuContent}
      </Styled.MenuContent>
    </Menu>
  );
}
