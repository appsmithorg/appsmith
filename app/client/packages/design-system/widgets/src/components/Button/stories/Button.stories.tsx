import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Flex, BUTTON_VARIANTS, COLORS, SIZES } from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";

/**
 * A button is a clickable element that is used to trigger an action.
 */
const meta: Meta<typeof Button> = {
  component: Button,
  title: "WDS/Widgets/Button",
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Main: Story = {
  args: {
    children: "Button",
  },
};

/**
 * There are 3 variants of the button component.
 */
export const Variants: Story = {
  render: () => (
    <Flex gap="spacing-4" wrap="wrap">
      {objectKeys(BUTTON_VARIANTS).map((variant) => (
        <Button key={`${variant}`} variant={variant}>
          {variant}
        </Button>
      ))}
    </Flex>
  ),
};

/**
 * `Button` component has 3 visual style variants and 5 semantic color options
 */
export const Semantic: Story = {
  render: () => (
    <Flex gap="spacing-4" wrap="wrap">
      {objectKeys(BUTTON_VARIANTS).map((variant) =>
        Object.values(COLORS).map((color) => (
          <Button color={color} key={`${variant}-${color}`} variant={variant}>
            {`${variant}-${color}`}
          </Button>
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
    <Flex alignItems="start" gap="spacing-4">
      {Object.keys(SIZES)
        .filter((size) => !["large"].includes(size))
        .map((size) => (
          <Button icon="star" key={size} size={size}>
            {size}
          </Button>
        ))}
    </Flex>
  ),
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    children: "Button",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Icon: Story = {
  args: {
    icon: "star",
  },
};

export const IconPosition: Story = {
  render: () => (
    <Flex gap="spacing-4">
      <Button icon="star" iconPosition="start">
        Button
      </Button>
      <Button icon="star" iconPosition="end">
        Button
      </Button>
    </Flex>
  ),
};
