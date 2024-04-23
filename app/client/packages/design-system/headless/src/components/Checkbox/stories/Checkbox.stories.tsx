import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, CheckboxGroup } from "@design-system/headless";

const meta: Meta<typeof CheckboxGroup> = {
  component: CheckboxGroup,
  title: "Design-system/headless/CheckboxGroup",
  subcomponents: {
    Checkbox,
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="value-1">Value 1</Checkbox>
      <Checkbox value="value-2">Value 2</Checkbox>
    </CheckboxGroup>
  ),
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Main: Story = {};
