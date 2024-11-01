import React from "react";
import { Button, Tooltip } from "@appsmith/wds";
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
      <Tooltip open placement="left" tooltip="This is a tooltip">
        <Button>Button</Button>
      </Tooltip>
      <Tooltip open placement="top" tooltip="This is a tooltip">
        <Button>Button</Button>
      </Tooltip>
      <Tooltip open placement="bottom" tooltip="This is a tooltip">
        <Button>Button</Button>
      </Tooltip>
      <Tooltip open placement="right" tooltip="This is a tooltip">
        <Button>Button</Button>
      </Tooltip>
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};
