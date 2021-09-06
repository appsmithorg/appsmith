import React from "react";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import MenuItem, { MenuItemProps } from "components/ads/MenuItem";
import { IconCollection, IconName } from "components/ads/Icon";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.menus.menuItem.PATH,
  component: MenuItem,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function MenuItemStory(args: MenuItemProps) {
  if (args.label) {
    args.label = <span>{args.label}</span>;
  }
  return <MenuItem {...args} onSelect={action("menu-item-selected")} />;
}

MenuItemStory.args = {
  icon: "Select a icon" as IconName,
  text: "Menu Item",
  label: "W",
  href: "",
  type: "warning",
  ellipsize: 0,
  selected: true,
};

MenuItemStory.argTypes = {
  icon: {
    control: controlType.SELECT,
    options: ["Select a icon" as IconName, ...IconCollection],
  },
  text: { control: controlType.TEXT },
  label: {
    control: controlType.TEXT,
    description: "ReactNode",
  },
  href: {
    control: controlType.TEXT,
    description: "url link",
  },
  type: { control: controlType.TEXT },
  ellipsize: { control: controlType.NUMBER },
  selected: { control: controlType.BOOLEAN },
};

MenuItemStory.storyName = storyName.platform.menus.menuItem.NAME;
