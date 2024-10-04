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
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
        <MenuItem>Item 3</MenuItem>
        <MenuItem>Item 4</MenuItem>
        <SubmenuTrigger>
          <MenuItem>Submenu</MenuItem>
          <Menu>
            <MenuItem>Submenu Item 1</MenuItem>
            <MenuItem>Submenu Item 2</MenuItem>
            <MenuItem>Submenu Item 3</MenuItem>
            <MenuItem>Submenu Item 4</MenuItem>
          </Menu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>
  ),
};

export const Submenus: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Open The Menu…</Button>
      <Menu>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
        <SubmenuTrigger>
          <MenuItem>Submenu 1</MenuItem>
          <Menu>
            <MenuItem>Submenu 1 Item 1</MenuItem>
            <MenuItem>Submenu 1 Item 2</MenuItem>
            <SubmenuTrigger>
              <MenuItem>Submenu 2</MenuItem>
              <Menu>
                <MenuItem>Submenu 2 Item 1</MenuItem>
                <MenuItem>Submenu 2 Item 2</MenuItem>
              </Menu>
            </SubmenuTrigger>
          </Menu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>
  ),
};

export const DisabledItems: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Open The Menu…</Button>
      <Menu disabledKeys={["2", "3"]}>
        <MenuItem id="1">Enabled Item</MenuItem>
        <MenuItem id="2">Disabled Item 1</MenuItem>
        <MenuItem id="3">Disabled Item 2</MenuItem>
        <MenuItem id="4">Enabled Item</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Open The Menu…</Button>
      <Menu>
        <MenuItem icon="home">Home</MenuItem>
        <MenuItem icon="file">Files</MenuItem>
        <MenuItem icon="settings">Settings</MenuItem>
        <MenuItem icon="question-mark">Help</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};
