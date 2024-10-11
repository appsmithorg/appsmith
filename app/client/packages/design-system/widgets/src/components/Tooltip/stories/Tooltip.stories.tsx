import React from "react";
import { Button, Flex, Tooltip } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * A tooltip is a small pop-up that appears when a user places their cursor over an element such as a link or button. Tooltips can be used to provide users with additional information about an element without having to clutter up the UI with additional text.
 */
const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: "WDS/Widgets/Tooltip",
  args: {
    tooltip: "My tooltip",
    children: <Button>My trigger</Button>,
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Main: Story = {};

/**
 * If the trigger is disabled, the tooltip will still be displayed.
 */
export const Disabled: Story = {
  args: {
    children: <Button isDisabled>My Trigger</Button>,
  },
};

export const Placement: Story = {
  render: () => {
    return (
      <Flex direction="column" gap="spacing-4">
        <Tooltip placement="top" tooltip="Top">
          <Button>Top</Button>
        </Tooltip>
        <Tooltip placement="bottom" tooltip="Bottom">
          <Button>Bottom</Button>
        </Tooltip>
        <Tooltip placement="left" tooltip="Left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip placement="right" tooltip="Right">
          <Button>Right</Button>
        </Tooltip>
      </Flex>
    );
  },
};
