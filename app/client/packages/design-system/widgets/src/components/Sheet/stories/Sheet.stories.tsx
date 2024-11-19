import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sheet } from "../index";
import { SimpleSheet } from "./SimpleSheet";

const meta: Meta<typeof Sheet> = {
  title: "WDS/Widgets/Sheet",
  component: Sheet,
  render: (args) => <SimpleSheet {...args} />,
};

export default meta;
type Story = StoryObj<typeof Sheet>;

// Default story with left position (start)
export const Default: Story = {
  args: {
    position: "start",
  },
};

// Right position (end)
export const RightPositioned: Story = {
  args: {
    position: "end",
  },
};
