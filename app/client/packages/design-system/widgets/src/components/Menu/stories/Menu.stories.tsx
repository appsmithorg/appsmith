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
        {Array.from({ length: 100 }, (_, i) => (
          <MenuItem id={String(i + 1)} key={i}>
            Item {i + 1}
          </MenuItem>
        ))}
        <SubmenuTrigger>
          <MenuItem id="5">Submenu</MenuItem>
          <Menu>
            <MenuItem id="6">Submenu Item 1</MenuItem>
            <MenuItem id="7">Submenu Item 2</MenuItem>
            <MenuItem id="8">Submenu Item 3</MenuItem>
            <MenuItem id="9">Submenu Item 4</MenuItem>
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
        <MenuItem id="1">Item 1</MenuItem>
        <MenuItem id="2">Item 2</MenuItem>
        <SubmenuTrigger>
          <MenuItem id="3">Submenu 1</MenuItem>
          <Menu>
            <MenuItem id="4">Submenu 1 Item 1</MenuItem>
            <MenuItem id="5">Submenu 1 Item 2</MenuItem>
            <SubmenuTrigger>
              <MenuItem id="6">Submenu 2</MenuItem>
              <Menu>
                <MenuItem id="7">Submenu 2 Item 1</MenuItem>
                <MenuItem id="8">Submenu 2 Item 2</MenuItem>
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
