import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@design-system/headless";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Design-system/headless/Button",
  render: () => <Button>Button</Button>,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Main: Story = {};
