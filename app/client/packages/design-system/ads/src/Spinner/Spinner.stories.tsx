import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Spinner } from "./Spinner";

export default {
  title: "ADS/Spinner",
  component: Spinner,
} as ComponentMeta<typeof Spinner>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Spinner> = (args) => {
  return <Spinner {...args} />;
};

export const SmallSpinnerStory = Template.bind({});
SmallSpinnerStory.storyName = "Spinner";
SmallSpinnerStory.args = {
  size: "sm",
};

export const MediumSpinnerStory = Template.bind({});
MediumSpinnerStory.storyName = "Spinner";
MediumSpinnerStory.args = {
  size: "md",
};

export const LargeSpinnerStory = Template.bind({});
LargeSpinnerStory.storyName = "Spinner";
LargeSpinnerStory.args = {
  size: "lg",
};
