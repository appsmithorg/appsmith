import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxGroup, Flex, Checkbox } from "@design-system/widgets";

/**
 * Checkbox Group is a group of checkboxes that can be selected together.
 */
const meta: Meta<typeof CheckboxGroup> = {
  component: CheckboxGroup,
  title: "Design-system/Widgets/CheckboxGroup",
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

export const Main: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="value-1">Value 1</Checkbox>
      <Checkbox value="value-2">Value 2</Checkbox>
    </CheckboxGroup>
  ),
};

/**
 * The component supports two label orientations `vertical` and `horizontal`. Default size is `horizontal`.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <CheckboxGroup>
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup orientation="vertical">
        <Checkbox value="value-1">Value 1</Checkbox>
        <Checkbox value="value-2">Value 2</Checkbox>
      </CheckboxGroup>
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    isDisabled: true,
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="value-1">Value 1</Checkbox>
      <Checkbox value="value-2">Value 2</Checkbox>
    </CheckboxGroup>
  ),
};

export const Required: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    isRequired: true,
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="value-1">Value 1</Checkbox>
      <Checkbox value="value-2">Value 2</Checkbox>
    </CheckboxGroup>
  ),
};

export const Invalid: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    validationState: "invalid",
    errorMessage: "This is a error message",
  },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="value-1">Value 1</Checkbox>
      <Checkbox value="value-2">Value 2</Checkbox>
    </CheckboxGroup>
  ),
};
