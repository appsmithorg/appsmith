import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "@appsmith/wds-headless";
import { Button } from "react-aria-components";

/**
 * A tooltip is a small pop-up that appears when a user places their cursor over an element such as a link or button. Tooltips can be used to provide users with additional information about an element without having to clutter up the UI with additional text.
 */
const meta: Meta<typeof TooltipRoot> = {
  component: TooltipRoot,
  title: "WDS/Headless/Tooltip",
  subcomponents: {
    TooltipTrigger,
    TooltipContent,
  },
  render: (args) => (
    <TooltipRoot {...args}>
      <TooltipTrigger>
        <Button>My trigger</Button>
      </TooltipTrigger>
      <TooltipContent>My tooltip</TooltipContent>
    </TooltipRoot>
  ),
};

export default meta;
type Story = StoryObj<typeof TooltipRoot>;

export const Main: Story = {};

/**
 * The placement of the tooltip can be changed by passing the `placement` prop.
 */
export const Placement: Story = {
  render: () => (
    <>
      <TooltipRoot placement="left">
        <TooltipTrigger>
          <Button>Left</Button>
        </TooltipTrigger>
        <TooltipContent>My tooltip</TooltipContent>
      </TooltipRoot>
      <TooltipRoot placement="top">
        <TooltipTrigger>
          <Button>Top</Button>
        </TooltipTrigger>
        <TooltipContent>My tooltip</TooltipContent>
      </TooltipRoot>
      <TooltipRoot placement="bottom">
        <TooltipTrigger>
          <Button>Bottom</Button>
        </TooltipTrigger>
        <TooltipContent>My tooltip</TooltipContent>
      </TooltipRoot>
      <TooltipRoot placement="right">
        <TooltipTrigger>
          <Button>Right</Button>
        </TooltipTrigger>
        <TooltipContent>My tooltip</TooltipContent>
      </TooltipRoot>
    </>
  ),
};

/**
 * If the trigger is disabled, the tooltip will not be displayed.
 */
export const Disabled: Story = {
  render: () => (
    <TooltipRoot>
      <TooltipTrigger>
        <Button isDisabled>Disabled</Button>
      </TooltipTrigger>
      <TooltipContent>My tooltip</TooltipContent>
    </TooltipRoot>
  ),
};
