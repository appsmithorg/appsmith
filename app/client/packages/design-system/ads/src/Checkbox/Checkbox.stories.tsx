import React from "react";
import { Checkbox } from "./Checkbox";
import type { CheckboxProps } from "./Checkbox.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Checkbox",
  component: Checkbox,
};

// eslint-disable-next-line react/function-component-definition
const Template = ({ children, ...args }: CheckboxProps) => {
  return <Checkbox {...args}>{children}</Checkbox>;
};

export const CheckboxStory = Template.bind({}) as StoryObj;
CheckboxStory.storyName = "Checkbox";
CheckboxStory.args = {
  isIndeterminate: false,
  value: "soccer",
  children: "Soccer",
};

export const CheckboxCheckedStory = Template.bind({}) as StoryObj;
CheckboxCheckedStory.args = {
  ...CheckboxStory.args,
  isSelected: true,
};

export const CheckboxDisabledStory = Template.bind({}) as StoryObj;
CheckboxDisabledStory.args = {
  ...CheckboxStory.args,
  isDisabled: true,
};

export const CheckboxIndeterminateStory = Template.bind({}) as StoryObj;
CheckboxIndeterminateStory.args = {
  ...CheckboxStory.args,
  isIndeterminate: true,
};
