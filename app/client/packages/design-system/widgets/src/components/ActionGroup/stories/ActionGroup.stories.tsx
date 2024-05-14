import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ActionGroupItem } from "@design-system/widgets";
import { ActionGroup } from "@design-system/widgets";

/**
 * A `ActionGroup` is a group of `MenuItem` that are visually connected together.
 * The `MenuItem` accepts the same props as the `Button` except `variant` and `color`.
 * More information about `Button` props you can find [here](?path=/docs/design-system-widgets-button--docs).
 */
const meta: Meta<typeof ActionGroup> = {
  component: ActionGroup,
  title: "Design-system/Widgets/ActionGroup",
};

export default meta;
type Story = StoryObj<typeof ActionGroup>;

const items: ActionGroupItem[] = [
  { id: 1, label: "Aerospace", icon: "rocket" },
  { id: 2, label: "Mechanical", icon: "settings" },
  { id: 3, label: "Civil" },
  { id: 4, label: "Biomedical" },
  { id: 5, label: "Nuclear" },
  { id: 6, label: "Industrial" },
  { id: 7, label: "Chemical" },
  { id: 99, isSeparator: true },
  { id: 8, label: "Agricultural" },
  { id: 9, label: "Electrical", icon: "settings" },
];

export const Main: Story = {
  render: (args) => <ActionGroup items={items} {...args} />,
};
