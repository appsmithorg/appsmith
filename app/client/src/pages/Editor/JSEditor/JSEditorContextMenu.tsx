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
} from "@appsmith/ads";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

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
  onMenuClose: (() => void) | undefined;
}

export function JSEditorContextMenu({
  className,
  onMenuClose,
  options,
}: EntityContextMenuProps) {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (options.length === 0) {
    return null;
  }

  return (
    <Menu
      className={className}
      onOpenChange={(open) => {
        if (!open) {
          onMenuClose?.();
        }
      }}
    >
      <MenuTrigger>
        <Button
          data-testid="more-action-trigger"
          isIconButton
          kind="tertiary"
          size={isActionRedesignEnabled ? "sm" : "md"}
          startIcon={isActionRedesignEnabled ? "more-2-fill" : "context-menu"}
        />
      </MenuTrigger>
      <MenuContent align="end" avoidCollisions>
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
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
