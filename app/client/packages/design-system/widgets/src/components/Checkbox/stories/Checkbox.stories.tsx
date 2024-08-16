import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, Flex } from "@appsmith/wds";

/**
 * Checkbox is a component that allows the user to select one or more options from a set.
 */
const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: "WDS/Widgets/Checkbox",
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Main: Story = {
  args: {
    children: "Check me",
  },
};

export const States: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <Checkbox>Unchecked</Checkbox>
      <Checkbox defaultSelected>Checked</Checkbox>
      <Checkbox isDisabled>Disabled</Checkbox>
      <Checkbox defaultSelected isDisabled>
        Disabled checked
      </Checkbox>
      <Checkbox isIndeterminate>Indeterminate</Checkbox>
      <Checkbox isInvalid>Error</Checkbox>
    </Flex>
  ),
};

export const IsRequired: Story = {
  render: () => (
    <Flex direction="column" gap="1rem" wrap="wrap">
      <Checkbox isRequired>Required</Checkbox>
    </Flex>
  ),
};
