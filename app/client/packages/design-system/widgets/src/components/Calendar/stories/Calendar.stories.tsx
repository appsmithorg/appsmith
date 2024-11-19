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

// Basic calendar with default settings
export const Default: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
  },
};

// Calendar with a minimum selectable date
export const WithMinDate: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    minValue: today(getLocalTimeZone()),
  },
};

// Calendar with a disabled state
export const Disabled: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    isDisabled: true,
  },
};

// Calendar with a read-only state
export const ReadOnly: Story = {
  args: {
    defaultValue: today(getLocalTimeZone()),
    isReadOnly: true,
  },
};
