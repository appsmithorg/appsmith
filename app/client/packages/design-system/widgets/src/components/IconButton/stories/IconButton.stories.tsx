import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Flex,
  IconButton,
  SIZES,
  BUTTON_VARIANTS,
  COLORS,
  type IconButtonProps,
} from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";

/**
 * Icon Button is a button component that only contains an icon.
 */
const meta: Meta<typeof IconButton> = {
  component: IconButton,
  title: "WDS/Widgets/Icon Button",
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Main: Story = {
  args: {
    icon: "star",
  },
};

/**
 * Just like Button component, There are 3 variants of the icon button component.
 */
export const Variants: Story = {
  render: () => (
    <Flex gap="spacing-4" wrap="wrap">
      {objectKeys(BUTTON_VARIANTS).map((variant) => (
        <IconButton icon="star" key={`${variant}`} variant={variant} />
      ))}
    </Flex>
  ),
};

/**
 * `IconButton` component has 3 visual style variants and 5 semantic color options, similar to `Button` component.
 */
export const Semantic: Story = {
  render: () => (
    <Flex gap="1rem" wrap="wrap">
      {objectKeys(BUTTON_VARIANTS).map((variant) =>
        Object.values(COLORS).map((color) => (
          <IconButton
            color={color}
            icon="star"
            key={`${variant}-${color}`}
            variant={variant}
          />
        )),
      )}
    </Flex>
  ),
};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex alignItems="start" gap="spacing-2">
      {objectKeys(SIZES)
        .filter(
          (size): size is NonNullable<IconButtonProps["size"]> =>
            !["xSmall", "large"].includes(size),
        )
        .map((size) => (
          <IconButton icon="star" key={size} size={size} />
        ))}
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    icon: "star",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    icon: "star",
  },
};
