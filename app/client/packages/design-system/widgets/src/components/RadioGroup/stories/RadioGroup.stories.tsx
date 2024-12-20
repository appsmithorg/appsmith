import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, Flex, Radio } from "@appsmith/wds";

const items = [
  { label: "Value 1", value: "value-1" },
  { label: "Value 2", value: "value-2" },
];

const meta: Meta<typeof RadioGroup> = {
  title: "WDS/Widgets/Radio Group",
  component: RadioGroup,
  tags: ["autodocs"],
  args: {
    defaultValue: "value-1",
    children: items.map((item) => (
      <Radio key={item.value} value={item.value}>
        {item.label}
      </Radio>
    )),
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Main: Story = {
  args: {
    label: "Label",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Description",
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
        <RadioGroup label="Vertical" orientation="vertical">
          {items.map((item) => (
            <Radio key={item.value} value={item.value}>
              {item.label}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup label="Horizontal" orientation="horizontal">
          {items.map((item) => (
            <Radio key={item.value} value={item.value}>
              {item.label}
            </Radio>
          ))}
        </RadioGroup>
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
