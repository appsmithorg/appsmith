import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Flex } from "@appsmith/wds";
import type { SelectProps } from "@appsmith/wds";
import { MultiSelect, SIZES } from "@appsmith/wds";

const items = Array.from({ length: 50 }, (_, i) => ({
  value: `Option ${i + 1}`,
  label: `Option ${i + 1}`,
}));

/**
 * A multi select component is a component that allows users to select multiple options from a list.
 */
const meta: Meta<typeof MultiSelect> = {
  component: MultiSelect,
  title: "WDS/Widgets/Multi Select",
  args: {
    label: "Label",
    items,
    placeholder: "Placeholder",
  },
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Main: Story = {};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="300px">
      {Object.keys(SIZES)
        .filter(
          (size): size is NonNullable<SelectProps["size"]> =>
            !["xSmall", "large"].includes(size),
        )
        .map((size) => (
          <MultiSelect
            items={items}
            key={size}
            label={size}
            placeholder={size}
            size={size}
          />
        ))}
    </Flex>
  ),
};

export const Loading: Story = {
  args: {
    placeholder: "Loading",
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled",
    isDisabled: true,
  },
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: "There is an error",
    isInvalid: true,
    isRequired: true,
  },
};

export const ContextualHelp: Story = {
  args: {
    label: "Label",
    placeholder: "Contextual Help Text",
    contextualHelp: "This is a contextual help text",
  },
};
