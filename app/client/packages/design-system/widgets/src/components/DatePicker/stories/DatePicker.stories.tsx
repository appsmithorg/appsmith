import React from "react";
import { Flex, SIZES } from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";
import type { Meta, StoryObj } from "@storybook/react";

import { DatePicker } from "../src";

/**
 * A date picker allows a user to select a date.
 */
const meta: Meta<typeof DatePicker> = {
  component: DatePicker,
  title: "WDS/Widgets/DatePicker",
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Main: Story = {
  args: {},
  render: (args) => (
    <Flex width="sizing-60">
      <DatePicker {...args} />
    </Flex>
  ),
};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="sizing-60">
      {objectKeys(SIZES)
        .filter((size) => !["xSmall", "large"].includes(size))
        .map((size) => (
          <DatePicker key={size} placeholder={size} size={size} />
        ))}
    </Flex>
  ),
};
