import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import ToggleComponent from "./index";

export default {
  title: "Design System/Toggle",
  component: ToggleComponent,
} as ComponentMeta<typeof ToggleComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ToggleComponent> = (args) => {
  return <ToggleComponent {...args} />;
};

export const Toggle = Template.bind({});
Toggle.args = {
  value: true,
  // eslint-disable-next-line no-console
  onToggle: () => console.log("toggle"),
};
