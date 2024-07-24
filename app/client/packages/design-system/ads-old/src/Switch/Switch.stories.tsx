import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import SwitchComponent from "./index";

export default {
  title: "Design System/Switch",
  component: SwitchComponent,
} as ComponentMeta<typeof SwitchComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof SwitchComponent> = (args) => (
  <SwitchComponent {...args} />
);

export const Switch = Template.bind({}) as StoryObj;

Switch.args = {
  checked: true,
  large: true,
};
