import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { MultiSelect } from "@appsmith/wds";

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
const meta: Meta<typeof MultiSelect> = {
  component: MultiSelect,
  title: "WDS/Widgets/Multi Select",
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

const options = Array.from({ length: 10 }, (_, i) => ({
  value: `Option ${i + 1}`,
  label: `Option ${i + 1}`,
}));

export const MultiSelectStory: Story = {
  render: () => {
    return (
      <MultiSelect
        disabledKeys={["Option 3"]}
        items={options}
        label="Multi"
        placeholder="Select options"
      />
    );
  },
};
