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
  title: "WDS/Widgets/Date Picker",
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Main: Story = {
  args: {},
  render: (args) => (
    <Flex width="sizing-60">
      <DatePicker {...args} popoverClassName="sb-unstyled" />
    </Flex>
  ),
};

export const WithDefaultValue: Story = {
  args: {
    label: "Default Value",
    value: parseDate("2023-06-15"),
  },
  render: (args) => (
    <Flex width="sizing-60">
      <DatePicker {...args} popoverClassName="sb-unstyled" />
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
          <DatePicker key={size} popoverClassName="sb-unstyled" size={size} />
        ))}
    </Flex>
  ),
};

export const Loading: Story = {
  args: {
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
          isRequired
          label="Validation"
          popoverClassName="sb-unstyled"
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </form>
  ),
};

export const ContextualHelp: Story = {
  args: {
    label: "Date",
    contextualHelp: "Click to open the date picker and select a date",
  },
};

export const MaxDate: Story = {
  args: {
    label: "Date",
    maxValue: parseDate("2024-06-15"),
  },
};

export const MinDate: Story = {
  args: {
    label: "Date",
    minValue: parseDate("2024-06-15"),
  },
};

export const Granularity: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-5" width="sizing-100">
      <DatePicker
        granularity="day"
        label="Day"
        popoverClassName="sb-unstyled"
      />
      <DatePicker
        granularity="hour"
        label="Hour"
        popoverClassName="sb-unstyled"
      />
      <DatePicker
        granularity="minute"
        label="Minute"
        popoverClassName="sb-unstyled"
      />
      <DatePicker
        granularity="second"
        label="Second"
        popoverClassName="sb-unstyled"
      />
    </Flex>
  ),
};
