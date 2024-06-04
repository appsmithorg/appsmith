import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, Radio, Flex } from "@design-system/widgets";

/**
 * Radio group is a component that allows users to select one option from a set of options.
 */
const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  title: "Design-system/Widgets/RadioGroup",
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Main: Story = {
  args: {
    label: "Radio Group",
    defaultValue: "value-1",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="value-1">Value 1</Radio>
      <Radio value="value-2">Value 2</Radio>
    </RadioGroup>
  ),
};

/**
 * The component supports two label orientations `vertical` and `horizontal`. Default size is `horizontal`.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <RadioGroup>
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
      </RadioGroup>
      <RadioGroup orientation="vertical">
        <Radio value="value-1">Value 1</Radio>
        <Radio value="value-2">Value 2</Radio>
      </RadioGroup>
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Radio Group",
    defaultValue: "value-1",
    isDisabled: true,
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="value-1">Value 1</Radio>
      <Radio value="value-2">Value 2</Radio>
    </RadioGroup>
  ),
};

export const Required: Story = {
  args: {
    label: "Radio Group",
    defaultValue: "value-1",
    isRequired: true,
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="value-1">Value 1</Radio>
      <Radio value="value-2">Value 2</Radio>
    </RadioGroup>
  ),
};

export const Invalid: Story = {
  args: {
    label: "Radio Group",
    validationState: "invalid",
    errorMessage: "This is a error message",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="value-1">Value 1</Radio>
      <Radio value="value-2">Value 2</Radio>
    </RadioGroup>
  ),
};
