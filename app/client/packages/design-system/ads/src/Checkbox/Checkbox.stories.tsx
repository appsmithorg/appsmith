import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Checkbox } from "./Checkbox";

export default {
  title: "ADS/Checkbox",
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Checkbox> = ({ children, ...args }) => {
  return <Checkbox {...args}>{children}</Checkbox>;
};

export const CheckboxStory = Template.bind({});
CheckboxStory.storyName = "Checkbox";
CheckboxStory.args = {
  isIndeterminate: false,
  value: "soccer",
  children: "Soccer",
};

export const CheckboxCheckedStory = Template.bind({});
CheckboxCheckedStory.args = {
  ...CheckboxStory.args,
  isSelected: true,
};

export const CheckboxDisabledStory = Template.bind({});
CheckboxDisabledStory.args = {
  ...CheckboxStory.args,
  isDisabled: true,
};

export const CheckboxIndeterminateStory = Template.bind({});
CheckboxIndeterminateStory.args = {
  ...CheckboxStory.args,
  isIndeterminate: true,
};
