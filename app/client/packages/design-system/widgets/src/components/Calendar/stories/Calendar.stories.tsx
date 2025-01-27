import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "../src";
import { parseDate } from "@internationalized/date";

const meta: Meta<typeof Calendar> = {
  component: Calendar,
  title: "WDS/Widgets/Calendar",
  parameters: {
    docs: {
      description: {
        component: "A calendar component for date selection and display.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  args: {
    defaultValue: parseDate("2024-01-01"),
  },
};

export const WithMinDate: Story = {
  args: {
    defaultValue: parseDate("2024-01-01"),
    minValue: parseDate("2024-01-01"),
  },
};

export const WithMaxDate: Story = {
  args: {
    defaultValue: parseDate("2024-01-01"),
    maxValue: parseDate("2024-01-11"),
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: parseDate("2024-01-01"),
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: parseDate("2024-01-01"),
    isReadOnly: true,
  },
};
