import React from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Menu from "../ads/Menu";
import { action } from "@storybook/addon-actions";
import MenuDivider from "../ads/MenuDivider";
import MenuItem from "../ads/MenuItem";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

export default {
  title: "Menu",
  component: Menu,
  decorators: [withKnobs, withDesign],
};

export const TextAndIconMenu = () => (
  <Menu
    position={select(
      "position",
      [
        Position.RIGHT,
        Position.RIGHT_BOTTOM,
        Position.RIGHT_TOP,
        Position.LEFT,
        Position.LEFT_BOTTOM,
        Position.LEFT_TOP,
        Position.TOP_LEFT,
        Position.BOTTOM,
        Position.BOTTOM_LEFT,
        Position.BOTTOM_RIGHT,
        Position.TOP,
        Position.TOP_LEFT,
        Position.TOP_RIGHT,
      ],
      Position.RIGHT,
    )}
    target={<button>Click to show menu</button>}
  >
    <MenuItem
      text={text("First option", "Invite user")}
      icon={select("First Icon", ["Select icon", "delete", "user"], undefined)}
      onSelect={action("clicked-first-option")}
      label={<span>W</span>}
    />
    {boolean("First menu item divider", false) ? <MenuDivider /> : null}
    <MenuItem
      text={text("Second option", "Are you sure")}
      icon={select("Second Icon", ["Select icon", "delete", "user"], undefined)}
      onSelect={action("delete-icon-clicked")}
      label={<span>W</span>}
    />
    {boolean("Second menu item divider", false) ? <MenuDivider /> : null}
    <MenuItem
      text={text("Third option", "Third option text only")}
      onSelect={action("clicked-second-option")}
    />
  </Menu>
);
