import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import JSToggleButtonComponent from "./index";

export default {
  title: "Design System/JSToggleButton",
  component: JSToggleButtonComponent,
} as ComponentMeta<typeof JSToggleButtonComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof JSToggleButtonComponent> = (args) => {
  return <JSToggleButtonComponent {...args} />;
};

export const JSToggleButton = Template.bind({});
JSToggleButton.args = {
  //add arguments here
};
