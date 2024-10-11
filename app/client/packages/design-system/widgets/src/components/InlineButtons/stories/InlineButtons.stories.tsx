import React from "react";
import {
  InlineButtons,
  Flex,
  BUTTON_VARIANTS,
  COLORS,
  SIZES,
} from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";
import { objectKeys } from "@appsmith/utils";
import {
  itemList,
  longItemList,
  semanticItemList,
  itemListWithIcons,
} from "./inlineButtonsData";

/**
 * A `InlineButtons` is a group of buttons that are visually connected together.
 * More information about `Button` props you can find [here](?path=/docs/design-system-widgets-button--docs).
 */
const meta: Meta<typeof InlineButtons> = {
  component: InlineButtons,
  title: "WDS/Widgets/InlineButtons",
};

export default meta;
type Story = StoryObj<typeof InlineButtons>;

export const Main: Story = {
  render: (args) => <InlineButtons items={itemList} {...args} />,
};

/**
 * `InlineButtons` component has 3 visual style variants and 5 semantic color options
 */

export const Semantic: Story = {
  render: () => (
    <Flex alignItems="center" direction="column" gap="spacing-4" width="100%">
      {objectKeys(BUTTON_VARIANTS).map((variant) =>
        Object.values(COLORS).map((color) => (
          <InlineButtons
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
 * You can also customize the color and variant for each individual button through the item config.
 */

export const IndividualSemantic: Story = {
  render: () => <InlineButtons items={semanticItemList} />,
};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="100%">
      {Object.keys(SIZES)
        .filter((size) => !["xSmall", "large"].includes(size))
        .map((size) => (
          <InlineButtons items={itemList} key={size} size={size} />
        ))}
    </Flex>
  ),
};

/**
 * If there is not enough space for horizontal positioning, then the themes will be positioned vertically
 */
export const Responsive: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="sizing-50">
      <InlineButtons items={longItemList} />
    </Flex>
  ),
};

/**
 *  The items can be disabled by passing `disabledKeys` or `isDisabled` in the item configuration.
 *  Also, all items can be disabled by passing `isDisabled` to `InlineButtons` component.
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
