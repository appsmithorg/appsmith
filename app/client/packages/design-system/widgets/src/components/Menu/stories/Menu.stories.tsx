import React from "react";
import { Button, Menu, MenuTrigger } from "@design-system/widgets";
import type { MenuItem } from "@design-system/widgets";
import type { Meta, StoryObj } from "@storybook/react";

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

const items: MenuItem[] = [
  { id: 1, label: "Aerospace", icon: "rocket" },
  {
    id: 2,
    label: "Mechanical",
    icon: "settings",
    childItems: [
      { id: 21, label: "Aerospace", icon: "rocket" },
      {
        id: 22,
        label: "Mechanical",
        icon: "settings",
        childItems: [
          { id: 31, label: "Aerospace", icon: "rocket" },
          { id: 32, label: "Mechanical", icon: "settings" },
        ],
      },
    ],
  },
  { id: 3, label: "Civil" },
  { id: 4, label: "Biomedical" },
  { id: 5, label: "Nuclear" },
  { id: 6, label: "Industrial" },
  { id: 7, label: "Chemical" },
  { id: 8, label: "Agricultural" },
  { id: 9, label: "Electrical" },
];

export const Main: Story = {
  render: (args) => (
    <MenuTrigger>
      <Button icon="dots" />
      <Menu items={items} {...args} />
    </MenuTrigger>
  ),
};
