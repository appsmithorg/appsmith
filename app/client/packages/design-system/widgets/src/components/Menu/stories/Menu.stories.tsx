import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Menu, MenuList, Item, COLORS } from "@design-system/widgets";

/**
 * A menu displays a list of actions or options that a user can choose.
 *
 * Additional information about functionality of the component can be found in the [headless component story](/?path=/docs/design-system-headless-menu--docs).
 *
 * Item props are not pulled up in the ArgTypes, the data can be found [here](https://react-spectrum.adobe.com/react-aria/Menu.html#item).
 */
const meta: Meta<typeof Menu> = {
  component: Menu,
  title: "Design-system/Widgets/Menu",
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Main: Story = {
  render: (args) => (
    <Menu {...args} disabledKeys={["cut"]} onAction={(key) => alert(key)}>
      <Button>Press me</Button>
      <MenuList>
        <Item key="copy">Copy</Item>
        <Item key="cut">Cut</Item>
        <Item key="paste">Paste</Item>
      </MenuList>
    </Menu>
  ),
};

/**
 * Just like Button component, There are 3 variants of the icon button component.
 */
export const ItemColor: Story = {
  render: () => (
    <Menu>
      <Button>Press me</Button>
      <MenuList>
        {Object.values(COLORS).map((color) => (
          <Item color={color} key={color}>
            {color}
          </Item>
        ))}
      </MenuList>
    </Menu>
  ),
};
