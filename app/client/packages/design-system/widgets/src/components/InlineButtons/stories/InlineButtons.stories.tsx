import React from "react";
import { InlineButtons } from "@design-system/widgets";
import type { Meta, StoryObj } from "@storybook/react";
import type { InlineButtonsItem } from "@design-system/widgets";

/**
 * A `InlineButtons` is a group of buttons that are visually connected together.
 * The `Item` accepts the same props as the `Button` except `variant` and `color`.
 * More information about `Button` props you can find [here](?path=/docs/design-system-widgets-button--docs).
 */
const meta: Meta<typeof InlineButtons> = {
  component: InlineButtons,
  title: "Design-system/Widgets/InlineButtons",
};

export default meta;
type Story = StoryObj<typeof InlineButtons>;

const items: InlineButtonsItem[] = [
  { id: 1, label: "Aerospace", icon: "rocket" },
  { id: 2, label: "Mechanical", icon: "settings" },
  { id: 3, label: "Civil", icon: "settings" },
  { id: 4, label: "Biomedical" },
  { id: 5, label: "Nuclear" },
  { id: 6, label: "Industrial" },
  { id: 7, label: "Chemical" },
];

export const Main: Story = {
  render: (args) => <InlineButtons items={items} {...args} />,
};
