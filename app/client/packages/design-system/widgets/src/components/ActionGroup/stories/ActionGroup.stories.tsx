import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Flex,
  ActionGroup,
  COLORS,
  BUTTON_VARIANTS,
  Item,
  SIZES,
} from "@design-system/widgets";

/**
 * A `ActionGroup` is a group of `Item` that are visually connected together.
 * The `Item` accepts the same props as the `Button` except `variant` and `color`.
 * More information about `Button` props you can find [here](?path=/docs/design-system-widgets-button--docs).
 */
const meta: Meta<typeof ActionGroup> = {
  component: ActionGroup,
  title: "Design-system/Widgets/ActionGroup",
};

export default meta;
type Story = StoryObj<typeof ActionGroup>;

export const Main: Story = {
  render: (args) => (
    <ActionGroup {...args}>
      <Item icon="heart" key="option-1">
        Option 1
      </Item>
      <Item key="option-2">Option 2</Item>
      <Item key="option-3">Option 3</Item>
      <Item key="option-4">Option 4</Item>
    </ActionGroup>
  ),
};

/**
 * There are 3 variants of the ActionGroup component.
 */
export const Variants: Story = {
  render: () => (
    <Flex gap="1rem" wrap="wrap">
      {Object.values(BUTTON_VARIANTS).map((variant) => (
        <ActionGroup key={`${variant}`} variant={variant}>
          <Item>{variant}</Item>
          <Item>{variant}</Item>
          <Item>{variant}</Item>
        </ActionGroup>
      ))}
    </Flex>
  ),
};

/**
 * `ActionGroup` component has 3 visual style variants and 5 semantic color options
 */
export const Semantic: Story = {
  render: () => (
    <Flex alignItems="center" direction="column" gap="spacing-4">
      {Object.values(BUTTON_VARIANTS).map((variant) =>
        Object.values(COLORS).map((color) => (
          <ActionGroup
            color={color}
            key={`${variant}-${color}`}
            variant={variant}
          >
            <Item>
              {variant} {color}
            </Item>
            <Item>
              {variant} {color}
            </Item>
            <Item>
              {variant} {color}
            </Item>
          </ActionGroup>
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
    <Flex direction="column" gap="spacing-2">
      {Object.keys(SIZES)
        .filter((size) => !["large"].includes(size))
        .map((size) => (
          <ActionGroup key={size} size={size}>
            <Item key="option-1">Option 1</Item>
            <Item key="option-2">Option 2</Item>
            <Item key="option-3">Option 3</Item>
            <Item key="option-4">Option 4</Item>
          </ActionGroup>
        ))}
    </Flex>
  ),
};

/**
 * The `ActionGroup` can be oriented horizontally or vertically. By default, it is oriented horizontally.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-2">
      <ActionGroup>
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item key="option-3">Option 3</Item>
        <Item key="option-4">Option 4</Item>
      </ActionGroup>
      <ActionGroup orientation="vertical">
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item key="option-3">Option 3</Item>
        <Item key="option-4">Option 4</Item>
      </ActionGroup>
    </Flex>
  ),
};

/**
 * The `ActionGroup` can be `compact` or `regular`. By default, it is regular.
 */

export const Density: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-2">
      <ActionGroup density="compact">
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item key="option-3">Option 3</Item>
        <Item key="option-4">Option 4</Item>
      </ActionGroup>
      <ActionGroup>
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item key="option-3">Option 3</Item>
        <Item key="option-4">Option 4</Item>
      </ActionGroup>
    </Flex>
  ),
};

/**
 * The `ActionGroup` can be `collapse`. By default, it is not collapsed. When collpaised, the `ActionGroup` will show items based on the width available. The rest of the items will be shown under a dropdown menu.
 */

export const Overflow: Story = {
  render: () => (
    <Flex width="sizing-50">
      <ActionGroup overflowMode="collapse" variant="outlined">
        <Item icon="file" key="option-1">
          Option 1
        </Item>
        <Item key="option-2">Option 2</Item>
        <Item isSeparator />
        <Item icon="file" key="option-3">
          {"Option 3"}
        </Item>
        <Item color="negative" icon="trash" iconPosition="end" key="option-4">
          {"Option 4"}
        </Item>
      </ActionGroup>
    </Flex>
  ),
};

/**
 * The `ActionGroup` can have disabled keys.
 */

export const DisabledKeys: Story = {
  render: () => (
    <ActionGroup disabledKeys={["option-2", "option-4"]}>
      <Item key="option-1">Option 1</Item>
      <Item key="option-2">Option 2</Item>
      <Item key="option-3">Option 3</Item>
      <Item key="option-4">Option 4</Item>
    </ActionGroup>
  ),
};
