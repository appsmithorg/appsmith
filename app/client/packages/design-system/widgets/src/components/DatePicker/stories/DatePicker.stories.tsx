import React from "react";
import { objectKeys } from "@appsmith/utils";
import { Button, Flex, SIZES } from "@appsmith/wds";
import { parseDate } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react";

import { DatePicker } from "../src";
/**
 * A date picker allows a user to select a date.
 */
const meta: Meta<typeof DatePicker> = {
  component: DatePicker,
  title: "WDS/Widgets/DatePicker",
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Main: Story = {
  args: {},
  render: (args) => (
    <Flex width="sizing-60">
      <DatePicker {...args} />
    </Flex>
  ),
};

export const WithDefaultValue: Story = {
  args: {
    label: "Default Value",
    value: parseDate("2023-06-15"),
    placeholder: "Date with default value",
  },
  render: (args) => (
    <Flex width="sizing-60">
      <DatePicker {...args} />
    </Flex>
  ),
};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="sizing-60">
      {objectKeys(SIZES)
        .filter((size) => !["xSmall", "large"].includes(size))
        .map((size) => (
          <DatePicker key={size} placeholder={size} size={size} />
        ))}
    </Flex>
  ),
};

export const Loading: Story = {
  args: {
    placeholder: "Loading",
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const Validation: Story = {
  render: () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("Form submitted");
      }}
    >
      <Flex direction="column" gap="spacing-5" width="sizing-60">
        <DatePicker
          description="Please select a date"
          isRequired
          label="Validation"
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </form>
  ),
};

export const ContextualHelp: Story = {
  args: {
    label: "Date",
    placeholder: "Select a date",
    contextualHelp: "Click to open the date picker and select a date",
  },
};

export const MaxDate: Story = {
  args: {
    label: "Date",
    placeholder: "Select a date",
    maxValue: parseDate("2023-06-15"),
  },
};

export const MinDate: Story = {
  args: {
    label: "Date",
    placeholder: "Select a date",
    minValue: parseDate("2023-06-15"),
  },
};

export const Granularity: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-5" width="sizing-100">
      <DatePicker granularity="day" label="Day" />
      <DatePicker granularity="hour" label="Hour" />
      <DatePicker granularity="minute" label="Minute" />
      <DatePicker granularity="second" label="Second" />
    </Flex>
  ),
};
