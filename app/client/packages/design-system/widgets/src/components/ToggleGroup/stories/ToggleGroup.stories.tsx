import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, ToggleGroup, Flex, Switch } from "@appsmith/wds";

/**
 * Toggle Group is a group of Checkboxes or Switches that can be selected together.
 */
const meta: Meta<typeof ToggleGroup> = {
  component: ToggleGroup,
  title: "WDS/Widgets/ToggleGroup",
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

const items = [
  { label: "Value 1", value: "value-1" },
  { label: "Value 2", value: "value-2" },
];

export const Main: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    items: items,
  },
  render: (args) => (
    <ToggleGroup {...args}>
      {({ label, value }) => (
        <Checkbox key={value} value={value}>
          {label}
        </Checkbox>
      )}
    </ToggleGroup>
  ),
};

/**
 * The component supports two label orientations `vertical` and `horizontal`. Default size is `horizontal`.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <ToggleGroup items={items}>
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>
      <ToggleGroup items={items} orientation="vertical">
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    isDisabled: true,
    items: items,
  },
  render: (args) => (
    <ToggleGroup {...args}>
      {({ label, value }) => (
        <Checkbox key={value} value={value}>
          {label}
        </Checkbox>
      )}
    </ToggleGroup>
  ),
};

export const Required: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    isRequired: true,
    items: items,
  },
  render: (args) => (
    <ToggleGroup {...args}>
      {({ label, value }) => (
        <Checkbox key={value} value={value}>
          {label}
        </Checkbox>
      )}
    </ToggleGroup>
  ),
};

export const Invalid: Story = {
  args: {
    label: "Checkbox Group",
    defaultValue: ["value-1"],
    isInvalid: true,
    errorMessage: "This is a error message",
    items: items,
    contextualHelp: "Contextual Help",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      {({ label, value }) => (
        <Checkbox key={value} value={value}>
          {label}
        </Checkbox>
      )}
    </ToggleGroup>
  ),
};

/**
 * All the properties listed above can also be used for a Switch
 */
export const SwitchGroup: Story = {
  args: {
    label: "Switch Group",
    defaultValue: ["value-1"],
    items: items,
  },
  render: (args) => (
    <ToggleGroup {...args}>
      {({ label, value }) => (
        <Switch key={value} value={value}>
          {label}
        </Switch>
      )}
    </ToggleGroup>
  ),
};
