import React from "react";
import { Spinner } from "./Spinner";
import type { StoryObj } from "@storybook/react";
import type { SpinnerProps } from "./Spinner.types";

export default {
  title: "ADS/Components/Spinner",
  component: Spinner,
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: SpinnerProps) => {
  return <Spinner {...args} />;
};

export const SmallSpinnerStory = Template.bind({}) as StoryObj;
SmallSpinnerStory.storyName = "Spinner";
SmallSpinnerStory.args = {
  size: "sm",
};

export const MediumSpinnerStory = Template.bind({}) as StoryObj;
MediumSpinnerStory.storyName = "Spinner";
MediumSpinnerStory.args = {
  size: "md",
};

export const LargeSpinnerStory = Template.bind({}) as StoryObj;
LargeSpinnerStory.storyName = "Spinner";
LargeSpinnerStory.args = {
  size: "lg",
};
