import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Menu, MenuList, Item } from "@design-system/headless";
import { Button } from "react-aria-components";

/**
 * A menu displays a list of actions or options that a user can choose.
 *
 * Item props are not pulled up in the ArgsTable, the data can be found [here](https://react-spectrum.adobe.com/react-aria/Menu.html#item).
 */

const meta: Meta<typeof Menu> = {
  component: Menu,
  title: "Design-system/headless/Menu",
  subcomponents: {
    //@ts-expect-error: don't need props to pass here
    MenuList,
  },
  render: (args) => (
    <Menu {...args}>
      <Button>Menu trigger</Button>
      <MenuList>
        <Item>Cut</Item>
        <Item>Copy</Item>
        <Item>Paste</Item>
      </MenuList>
    </Menu>
  ),
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Main: Story = {};

/**
 * The placement of the menu can be changed by passing the `placement` prop.
 */
export const Placement: Story = {
  render: () => (
    <>
      <Menu placement="left">
        <Button>Left</Button>
        <MenuList>
          <Item key="copy">Copy</Item>
          <Item key="cut">Cut</Item>
          <Item key="paste">Paste</Item>
        </MenuList>
      </Menu>
      <Menu placement="top">
        <Button>Top</Button>
        <MenuList>
          <Item key="copy">Copy</Item>
          <Item key="cut">Cut</Item>
          <Item key="paste">Paste</Item>
        </MenuList>
      </Menu>
      <Menu placement="bottom">
        <Button>Bottom</Button>
        <MenuList>
          <Item key="copy">Copy</Item>
          <Item key="cut">Cut</Item>
          <Item key="paste">Paste</Item>
        </MenuList>
      </Menu>
      <Menu placement="right">
        <Button>Right</Button>
        <MenuList>
          <Item key="copy">Copy</Item>
          <Item key="cut">Cut</Item>
          <Item key="paste">Paste</Item>
        </MenuList>
      </Menu>
    </>
  ),
};
