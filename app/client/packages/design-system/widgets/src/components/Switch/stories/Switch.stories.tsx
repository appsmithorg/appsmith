import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch, Flex } from "@appsmith/wds";

/**
 * Switch is a component that allows the user to select one or more options from a set.
 */
const meta: Meta<typeof Switch> = {
  component: Switch,
  title: "WDS/Widgets/Switch",
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Main: Story = {
  args: {
    children: "Toggle me",
  },
};

export const States: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <Switch>Unchecked</Switch>
      <Switch defaultSelected>Checked</Switch>
      <Switch isDisabled>Disabled</Switch>
      <Switch defaultSelected isDisabled>
        Disabled checked
      </Switch>
    </Flex>
  ),
};

/**
 * The component supports two label positions `start` and `end`. Default size is `start`.
 */
export const LabelPosition: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <Switch>Label Position — end</Switch>
      <Switch labelPosition="start">Label Position — start</Switch>
    </Flex>
  ),
};
