import React from "react";
import { Button, Menu, MenuContent, MenuTrigger } from "@appsmith/ads";
import { useToggle } from "@mantine/hooks";

interface Props {
  children: React.ReactNode | React.ReactNode[];
}

export function JSEditorContextMenu({ children }: Props) {
  const [isMenuOpen, toggleMenuOpen] = useToggle([false, true]);

  return (
    <Menu
      className="t--more-action-menu"
      onOpenChange={toggleMenuOpen}
      open={isMenuOpen}
    >
      <MenuTrigger>
        <Button
          data-testid="t--more-action-trigger"
          isIconButton
          kind="tertiary"
          size={"sm"}
          startIcon={"more-2-fill"}
        />
      </MenuTrigger>
      <MenuContent align="end" avoidCollisions>
        {children}
      </MenuContent>
    </Menu>
  );
}

export default JSEditorContextMenu;
