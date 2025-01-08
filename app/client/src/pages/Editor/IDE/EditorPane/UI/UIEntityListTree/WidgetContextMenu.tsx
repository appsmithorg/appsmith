import React from "react";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "@appsmith/ads";
import { Icon } from "@appsmith/ads";
import { useDeleteWidget } from "pages/Editor/IDE/EditorPane/UI/UIEntityListTree/hooks";

interface WidgetContextMenuProps {
  canManagePages: boolean;
  widgetId: string;
}

export const WidgetContextMenu: React.FC<WidgetContextMenuProps> = ({
  canManagePages,
  widgetId,
}) => {
  const { handleDelete } = useDeleteWidget();

  const menuItems = [
    {
      text: "Delete",
      onClick: () => handleDelete(widgetId),
      isDisabled: !canManagePages,
    },
  ];

  return (
    <Menu>
      <MenuTrigger>
        <Icon name="more-2-fill" />
      </MenuTrigger>
      <MenuContent>
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={item.onClick}
            disabled={item.isDisabled}
          >
            {item.text}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};
