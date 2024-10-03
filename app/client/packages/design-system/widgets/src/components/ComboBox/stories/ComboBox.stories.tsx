import { ComboBox, ListBoxItem } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { items } from "./items";

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
const meta: Meta<typeof ComboBox> = {
  component: ComboBox,
  title: "WDS/Widgets/ComboBox",
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

export const Main: Story = {
  args: {
    children: (
      <>
        {items.map((item) => (
          <ListBoxItem key={item.id} textValue={item.label}>
            {item.label}
          </ListBoxItem>
        ))}
      </>
    ),
  },
};
