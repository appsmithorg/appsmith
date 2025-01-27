import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  BUTTON_VARIANTS,
  COLORS,
  Flex,
  ToolbarButtons,
  SIZES,
} from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";
import {
  itemList,
  itemListWithIcons,
  longItemList,
} from "./toolbarButtonsData";

/**
 * The `ToolbarButtons` is a group of buttons that are visually connected together.
 * The `MenuItem` accepts the same props as the `Button` except `variant` and `color`.
 * More information about `Button` props you can find [here](?path=/docs/design-system-widgets-button--docs).
 */
const meta: Meta<typeof ToolbarButtons> = {
  component: ToolbarButtons,
  title: "WDS/Widgets/Toolbar Buttons",
};

export default meta;
type Story = StoryObj<typeof ToolbarButtons>;

export const Main: Story = {
  render: (args) => <ToolbarButtons items={itemList} {...args} />,
};

/**
 * There are 3 variants of the ToolbarButtons component.
 */
export const Variants: Story = {
  render: () => (
    <Flex gap="1rem" wrap="wrap">
      {objectKeys(BUTTON_VARIANTS).map((variant) => (
        <ToolbarButtons items={itemList} key={variant} variant={variant} />
      ))}
    </Flex>
  ),
};

/**
 * The `ToolbarButtons` component has 3 visual style variants and 5 semantic color options
 */
export const Semantic: Story = {
  render: () => (
    <Flex alignItems="center" direction="column" gap="spacing-4" width="100%">
      {objectKeys(BUTTON_VARIANTS).map((variant) =>
        Object.values(COLORS).map((color) => (
          <ToolbarButtons
            color={color}
            items={itemList}
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
    <Flex direction="column" gap="spacing-4" width="100%">
      {objectKeys(SIZES)
        .filter((size) => !["xSmall", "large"].includes(size))
        .map((size) => (
          <ToolbarButtons
            items={itemList}
            key={size}
            size={size as Exclude<keyof typeof SIZES, "large">}
          />
        ))}
    </Flex>
  ),
};

/**
 * The `ToolbarButtons` can be aligned to the start, or end. By default, it is aligned to the start.
 */
export const Alignment: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="100%">
      <ToolbarButtons alignment="start" items={itemList} />
      <ToolbarButtons alignment="end" items={itemList} />
    </Flex>
  ),
};

/**
 * The `ToolbarButtons` can be `compact` or `regular`. By default, it is regular.
 */

export const Density: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="100%">
      <ToolbarButtons density="compact" items={itemList} />
      <ToolbarButtons items={itemList} />
    </Flex>
  ),
};

/**
 * The `ToolbarButtons` can be collapsed. When collpaised, the `ToolbarButtons` will show items based on the width available. The rest of the items will be shown under a dropdown
 * menu.
 */
export const Overflow: Story = {
  render: () => (
    <Flex width="sizing-100">
      <ToolbarButtons items={longItemList} />
    </Flex>
  ),
};

/**
 *  The items can be disabled by passing `disabledKeys` or `isDisabled` in the item configuration.
 *  Also, all items can be disabled by passing `isDisabled` to `ToolbarButtons` component.
 */
export const Disabled: Story = {
  args: {
    disabledKeys: [1, 2],
    items: itemList,
  },
};

export const WithIcons: Story = {
  args: {
    items: itemListWithIcons,
  },
};
