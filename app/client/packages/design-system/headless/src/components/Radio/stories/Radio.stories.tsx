import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, Radio } from "@design-system/headless";

/**
 * A Radio group is a group of radio buttons that are related to each other in some way. For example, they may all represent a single question on a survey. The Radio group component is a headless component that provides the logic and accessibility implementation for a group of radio buttons.
 *
 * Note: The `<input="radio" />` is visually hidden by default. Use the `<span data-icon />` to render custom looking radio.
 */
const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  title: "Design-system/headless/RadioGroup",
  subcomponents: {
    //@ts-expect-error: don't need props to pass here
    Radio,
  },
  render: (args) => (
    <RadioGroup label="Radio group" {...args}>
      <Radio value="option 1">Option 1</Radio>
      <Radio value="option 2">Option 2</Radio>
    </RadioGroup>
  ),
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Main: Story = {};
