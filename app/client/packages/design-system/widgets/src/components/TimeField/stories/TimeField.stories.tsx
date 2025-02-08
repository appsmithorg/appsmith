import type { Meta, StoryObj } from "@storybook/react";
import { TimeField } from "../src";

import { Time } from "@internationalized/date";

const meta: Meta<typeof TimeField> = {
  title: "WDS/Widgets/Time Field",
  component: TimeField,
  parameters: {
    docs: {
      description: {
        component:
          "A time input component that allows users to enter and select time values.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeField>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    value: new Time(14, 15),
    label: "With Label",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled",
    value: new Time(15, 30),
    isDisabled: true,
  },
};

export const WithError: Story = {
  args: {
    isInvalid: true,
    value: new Time(9, 45),
    errorMessage: "Please enter a valid time",
  },
};

export const Required: Story = {
  args: {
    label: "Required",
    isRequired: true,
  },
};
