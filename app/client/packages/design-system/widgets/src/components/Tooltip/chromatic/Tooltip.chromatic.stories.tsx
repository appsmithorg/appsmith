import React from "react";
import {
  Button,
  TooltipTrigger,
  TooltipContent,
  TooltipRoot as Tooltip,
} from "@appsmith/wds";
import { StoryGrid } from "@design-system/storybook";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: "Design System/Widgets/Tooltip",
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      <Tooltip open placement="left">
        <TooltipTrigger>
          <Button>Button</Button>
        </TooltipTrigger>
        <TooltipContent>This is a tooltip</TooltipContent>
      </Tooltip>
      <Tooltip open placement="top">
        <TooltipTrigger>
          <Button>Button</Button>
        </TooltipTrigger>
        <TooltipContent>This is a tooltip</TooltipContent>
      </Tooltip>
      <Tooltip open placement="bottom">
        <TooltipTrigger>
          <Button>Button</Button>
        </TooltipTrigger>
        <TooltipContent>This is a tooltip</TooltipContent>
      </Tooltip>
      <Tooltip open placement="right">
        <TooltipTrigger>
          <Button>Button</Button>
        </TooltipTrigger>
        <TooltipContent>This is a tooltip</TooltipContent>
      </Tooltip>
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};
