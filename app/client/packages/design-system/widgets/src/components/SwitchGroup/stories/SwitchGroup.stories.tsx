import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SwitchGroup, Flex, Switch } from "@design-system/widgets";

/**
 * Switch Group is a group of Switches that can be selected together.
 */
const meta: Meta<typeof SwitchGroup> = {
  component: SwitchGroup,
  title: "Design-system/Widgets/SwitchGroup",
};

export default meta;
type Story = StoryObj<typeof SwitchGroup>;

export const Main: Story = {
  args: {
    label: "Switch Group",
    defaultValue: ["value-1"],
  },
  render: (args) => (
    <SwitchGroup {...args}>
      <Switch value="value-1">Value 1</Switch>
      <Switch value="value-2">Value 2</Switch>
    </SwitchGroup>
  ),
};

/**
 * The component supports two label orientations `vertical` and `horizontal`. Default size is `horizontal`.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <SwitchGroup>
        <Switch value="value-1">Value 1</Switch>
        <Switch value="value-2">Value 2</Switch>
      </SwitchGroup>
      <SwitchGroup optionsLabelPosition="start" orientation="vertical">
        <Switch value="value-1">Value 1</Switch>
        <Switch value="value-2">Value 2</Switch>
      </SwitchGroup>
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Switch Group",
    defaultValue: ["value-1"],
    isDisabled: true,
  },
  render: (args) => (
    <SwitchGroup {...args}>
      <Switch value="value-1">Value 1</Switch>
      <Switch value="value-2">Value 2</Switch>
    </SwitchGroup>
  ),
};

export const Required: Story = {
  args: {
    label: "Switch Group",
    defaultValue: ["value-1"],
    isRequired: true,
  },
  render: (args) => (
    <SwitchGroup {...args}>
      <Switch value="value-1">Value 1</Switch>
      <Switch value="value-2">Value 2</Switch>
    </SwitchGroup>
  ),
};

export const Invalid: Story = {
  args: {
    label: "Switch Group",
    defaultValue: ["value-1"],
    validationState: "invalid",
    errorMessage: "This is a error message",
  },
  render: (args) => (
    <SwitchGroup {...args}>
      <Switch value="value-1">Value 1</Switch>
      <Switch value="value-2">Value 2</Switch>
    </SwitchGroup>
  ),
};
