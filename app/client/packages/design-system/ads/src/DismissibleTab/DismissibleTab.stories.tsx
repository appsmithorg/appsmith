/* eslint-disable no-console */
import type { Meta, StoryObj } from "@storybook/react";

import { DismissibleTab } from ".";

const meta: Meta<typeof DismissibleTab> = {
  title: "ADS/Components/Dismissible Tab",
  component: DismissibleTab,
};

export default meta;

type Story = StoryObj<typeof DismissibleTab>;

export const Basic: Story = {
  args: {
    isActive: true,
    dataTestId: "t--dismissible-tab",
    children: "Dismissible tab",
  },
};
