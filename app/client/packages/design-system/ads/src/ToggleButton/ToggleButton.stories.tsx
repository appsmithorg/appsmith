import React from "react";
import { ToggleButton } from "./ToggleButton";
import type { StoryObj } from "@storybook/react";
import type { ToggleButtonProps } from "./ToggleButton.types";

export default {
  title: "ADS/Components/Toggle Button/Toggle Button",
  component: ToggleButton,
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: ToggleButtonProps) => {
  return <ToggleButton {...args} />;
};

export const ToggleButtonStory = Template.bind({}) as StoryObj;
ToggleButtonStory.storyName = "Toggle Button";
ToggleButtonStory.args = {
  size: "sm",
  icon: "add-more",
};
