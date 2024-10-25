import React from "react";
import { Avatar, Flex } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Avatar> = {
  title: "WDS/Widgets/Avatar",
  component: Avatar,
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    label: "John Doe",
  },
};

export const WithImage: Story = {
  args: {
    label: "Jane Smith",
    src: "https://assets.appsmith.com/integrations/25720743.png",
  },
};

export const SingleInitial: Story = {
  args: {
    label: "Alice",
  },
};

export const Sizes: Story = {
  args: {
    label: "Alice",
  },
  render: (args) => (
    <Flex gap="spacing-2">
      <Avatar {...args} size="small" />
      <Avatar {...args} size="medium" />
      <Avatar {...args} size="large" />
    </Flex>
  ),
};
