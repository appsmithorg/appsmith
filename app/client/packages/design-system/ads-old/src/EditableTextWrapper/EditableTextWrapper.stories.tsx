import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import ThisComponent from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/ComponentDisplay",
  component: ThisComponent,
} as ComponentMeta<typeof ThisComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ThisComponent> = (args) => {
  return <ThisComponent {...args} />;
};

export const ComponentDisplay = Template.bind({});
ComponentDisplay.args = {
  //add arguments here
};
