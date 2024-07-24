import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import MenuComponent from "./index";
import MenuItem from "../MenuItem";

export default {
  title: "Design System/Menu",
  component: MenuComponent,
} as ComponentMeta<typeof MenuComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof MenuComponent> = (args) => {
  return (
    <MenuComponent {...args}>
      <MenuItem icon="edit-underline" text="Edit" />
      <MenuItem icon="setting" text="Settings" />
    </MenuComponent>
  );
};

export const Menu = Template.bind({}) as StoryObj;
Menu.args = {
  position: "bottom",
  target: <button>Open menu</button>,
};
