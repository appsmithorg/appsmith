import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ButtonGroup,
  Flex,
  BUTTON_VARIANTS,
  COLORS,
  SIZES,
  Item,
} from "@design-system/widgets";

/**
 * A `ButtonGroup` is a group of buttons that are visually connected together.
 * The `Item` accepts the same props as the `Button` except `variant` and `color`.
 * More information about `Button` props you can find [here](?path=/docs/design-system-widgets-button--docs).
 */
const meta: Meta<typeof ButtonGroup> = {
  component: ButtonGroup,
  title: "Design-system/Widgets/ButtonGroup",
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Main: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Item>Option 1</Item>
      <Item>Option 2</Item>
      <Item>Option 3</Item>
    </ButtonGroup>
  ),
};

/**
 * `ButtonGroup` component has 3 visual style variants and 5 semantic color options
 */

export const Semantic: Story = {
  render: () => (
    <Flex alignItems="center" direction="column" gap="spacing-4" width="100%">
      {Object.values(BUTTON_VARIANTS).map((variant) =>
        Object.values(COLORS).map((color) => (
          <ButtonGroup
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
          </ButtonGroup>
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
    <Flex gap="spacing-2">
      {Object.keys(SIZES)
        .filter((size) => !["large"].includes(size))
        .map((size) => (
          <ButtonGroup key={size} size={size}>
            <Item>Option 1</Item>
            <Item>Option 2</Item>
            <Item>Option 3</Item>
          </ButtonGroup>
        ))}
    </Flex>
  ),
};

/**
 * The `ButtonGroup` can be oriented horizontally or vertically. By default, it is oriented horizontally.
 */
export const Orientation: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-2">
      <ButtonGroup>
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item key="option-3">Option 3</Item>
        <Item key="option-4">Option 4</Item>
      </ButtonGroup>
      <ButtonGroup orientation="vertical">
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item key="option-3">Option 3</Item>
        <Item key="option-4">Option 4</Item>
      </ButtonGroup>
    </Flex>
  ),
};

/**
 * If there is not enough space for horizontal positioning, then the themes will be positioned vertically
 */
export const Responsive: Story = {
  render: () => (
    <Flex width="sizing-50">
      <ButtonGroup variant="outlined">
        <Item key="option-1">Option 1</Item>
        <Item key="option-2">Option 2</Item>
        <Item icon="file" key="option-3">
          {"Option 3"}
        </Item>
        <Item color="negative" icon="trash" iconPosition="end" key="option-4">
          {"Option 4"}
        </Item>
      </ButtonGroup>
    </Flex>
  ),
};
