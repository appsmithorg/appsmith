import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, Flex } from "@appsmith/wds";

/**
 * Radio group is a component that allows users to select one option from a set of options.
 */
const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  title: "WDS/Widgets/RadioGroup",
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

const items = [
  { label: "Value 1", value: "value-1" },
  { label: "Value 2", value: "value-2" },
];

export const Main: Story = {
  args: {
    label: "Radio Group",
    defaultValue: "value-1",
    items: items,
  },
  render: (args) => <RadioGroup {...args} />,
};

/**
 * The component supports two label orientations `vertical` and `horizontal`. Default size is `horizontal`.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <RadioGroup items={items} />
      <RadioGroup items={items} orientation="vertical" />
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Radio Group",
    defaultValue: "value-1",
    isDisabled: true,
    items: items,
  },
  render: (args) => <RadioGroup {...args} />,
};

export const Required: Story = {
  args: {
    label: "Radio Group",
    defaultValue: "value-1",
    isRequired: true,
    items: items,
  },
  render: (args) => <RadioGroup {...args} />,
};

export const Invalid: Story = {
  args: {
    label: "Radio Group",
    isInvalid: true,
    errorMessage: "This is a error message",
    items: items,
  },
  render: (args) => <RadioGroup {...args} />,
};
