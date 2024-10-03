import React from "react";
import {
  Button,
  Menu,
  MenuTrigger,
  MenuItem,
  SubmenuTrigger,
} from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * A menu displays a list of actions or options that a user can choose.
 *
 * Item props are not pulled up in the ArgTypes, the data can be found [here](https://react-spectrum.adobe.com/react-aria/Menu.html#item).
 */
const meta: Meta<typeof Menu> = {
  component: Menu,
  title: "WDS/Widgets/Menu",
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Main: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Open The Menu…</Button>
      <Menu>
        <MenuItem>Hello</MenuItem>
        <MenuItem>World</MenuItem>
        <MenuItem>Hello</MenuItem>
        <MenuItem>World</MenuItem>
        <SubmenuTrigger>
          <MenuItem>Submenu</MenuItem>
          <Menu>
            <MenuItem>Submenu</MenuItem>
            <MenuItem>Submenu</MenuItem>
            <MenuItem>Submenu</MenuItem>
            <MenuItem>Submenu</MenuItem>
          </Menu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>
  ),
};

// export const Submenus: Story = {
//   render: () => (
//     <MenuTrigger>
//       <Button>Open The Menu…</Button>
//       <Menu items={submenusItems} />
//     </MenuTrigger>
//   ),
// };

// /**
//  * The items can be disabled by passing `disabledKeys` or `isDisabled` in the item configuration.
//  */

// export const DisabledItems: Story = {
//   render: () => (
//     <MenuTrigger>
//       <Button>Open The Menu…</Button>
//       <Menu disabledKeys={[1, 2]} items={submenusItems} />
//     </MenuTrigger>
//   ),
// };

// export const WithIcons: Story = {
//   render: () => (
//     <MenuTrigger>
//       <Button>Open The Menu…</Button>
//       <Menu items={submenusItemsWithIcons} />
//     </MenuTrigger>
//   ),
// };
