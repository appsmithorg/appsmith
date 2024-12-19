import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, ToggleGroup, Flex, Switch } from "@appsmith/wds";

const items = [
  { label: "Value 1", value: "value-1" },
  { label: "Value 2", value: "value-2" },
];

const meta: Meta<typeof ToggleGroup> = {
  title: "WDS/Widgets/Toggle Group",
  component: ToggleGroup,
  tags: ["autodocs"],
  args: {
    defaultValue: ["value-1"],
    children: items.map((item) => (
      <Checkbox key={item.value} value={item.value}>
        {item.label}
      </Checkbox>
    )),
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Main: Story = {
  args: {
    label: "Label",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Label",
  },
};

export const WithContextualHelp: Story = {
  args: {
    label: "Label",
    contextualHelp: "Contextual help",
  },
};

export const Orientation: Story = {
  render: () => {
    return (
      <Flex direction="column" gap="spacing-4">
        <ToggleGroup label="Vertical" orientation="vertical">
          {items.map((item) => (
            <Checkbox key={item.value} value={item.value}>
              {item.label}
            </Checkbox>
          ))}
        </ToggleGroup>
        <ToggleGroup label="Horizontal" orientation="horizontal">
          {items.map((item) => (
            <Checkbox key={item.value} value={item.value}>
              {item.label}
            </Checkbox>
          ))}
        </ToggleGroup>
      </Flex>
    );
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    label: "Disabled",
  },
};

export const Required: Story = {
  args: {
    isRequired: true,
    label: "Required",
  },
};

export const Invalid: Story = {
  args: {
    errorMessage: "There is an error",
    label: "Invalid",
    isInvalid: true,
  },
};

export const WithSwitch: Story = {
  args: {
    label: "With Switch",
    children: items.map((item) => (
      <Switch key={item.value} value={item.value}>
        {item.label}
      </Switch>
    )),
  },
};
