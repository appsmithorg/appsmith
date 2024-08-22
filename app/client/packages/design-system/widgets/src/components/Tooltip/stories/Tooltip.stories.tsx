import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@appsmith/wds";

/**
 * A tooltip is a small pop-up that appears when a user places their cursor over an element such as a link or button. Tooltips can be used to provide users with additional information about an element without having to clutter up the UI with additional text.
 */
const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: "WDS/Widgets/Tooltip",
  subcomponents: {
    //@ts-expect-error: don't need props to pass here
    TooltipRoot,
    TooltipTrigger,
    TooltipContent,
  },
  args: {
    tooltip: "My tooltip",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>My trigger</Button>
    </Tooltip>
  ),
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Main: Story = {};

/**
 * If the trigger is disabled, the tooltip will still be displayed.
 */
export const Disabled: Story = {
  render: () => (
    <Tooltip tooltip="My tooltip">
      <Button isDisabled>My trigger</Button>
    </Tooltip>
  ),
};
