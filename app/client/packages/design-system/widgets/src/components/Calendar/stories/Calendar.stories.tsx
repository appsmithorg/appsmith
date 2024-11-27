import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "../src";
import { today, getLocalTimeZone } from "@internationalized/date";

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
    defaultValue: today(getLocalTimeZone()),
  },
};

export const WithMinDate: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    minValue: today(getLocalTimeZone()),
  },
};

export const WithMaxDate: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    maxValue: today(getLocalTimeZone()).add({ days: 10 }),
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    isReadOnly: true,
  },
};
