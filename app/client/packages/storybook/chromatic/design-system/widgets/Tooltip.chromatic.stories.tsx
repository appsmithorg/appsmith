import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  Button,
  TooltipTrigger,
  TooltipContent,
  TooltipRoot as Tooltip,
} from "@design-system/widgets";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: "Design System/Widgets/Tooltip",
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const States: Story = {
  render: () => (
    <Tooltip open>
      <TooltipTrigger>
        <Button>Button</Button>
      </TooltipTrigger>
      <TooltipContent>This is a tooltip</TooltipContent>
    </Tooltip>
  ),
};
