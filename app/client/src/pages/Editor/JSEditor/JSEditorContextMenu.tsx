import React from "react";
import type { IconName } from "@blueprintjs/icons";

import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Text,
} from "design-system";

export interface ContextMenuOption {
  id?: string;
  icon: IconName;
  value: string;
  onSelect?: (event?: Event) => void;
  label: string;
  subText?: string;
  className?: string;
  children?: Omit<ContextMenuOption, "children" | "icon">[];
}

interface EntityContextMenuProps {
  className?: string;
  options: ContextMenuOption[];
}

export function JSEditorContextMenu({
  className,
  options,
}: EntityContextMenuProps) {
  if (options.length === 0) {
    return null;
  }
  return (
    <Menu className={className}>
      <MenuTrigger>
        <Button
          data-testid="more-action-trigger"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent avoidCollisions>
        {options.map((option, index) => {
          if (option.children) {
            return (
              <MenuSub key={index}>
                <MenuSubTrigger startIcon={option.icon}>
                  {option.label}
                </MenuSubTrigger>
                <MenuSubContent>
                  {option.children.map((children) => (
                    <MenuItem key={children.value} onSelect={children.onSelect}>
                      {children.label}
                    </MenuItem>
                  ))}
                </MenuSubContent>
              </MenuSub>
            );
          }
          return (
            <MenuItem
              className={option?.className}
              key={option.value}
              onSelect={option.onSelect as any}
              startIcon={option.icon}
            >
              <div>
                <Text
                  color={
                    option?.value === "delete"
                      ? "var(--ads-v2-color-fg-error)"
                      : "var(--ads-v2-color-fg)"
                  }
                >
                  {option.label}
                </Text>
                {option.subText && (
                  <Text
                    color={"var(--ads-v2-color-fg-muted)"}
                    kind="body-s"
                    style={{ marginLeft: "7px" }}
                  >
                    {option.subText}
                  </Text>
                )}
              </div>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}

export default JSEditorContextMenu;
