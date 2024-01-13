import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { MenuDivider } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/Menu Divider",
  component: MenuDivider,
} as ComponentMeta<typeof MenuDivider>;

const Template: ComponentStory<typeof MenuDivider> = () => (
  <div style={{ minWidth: "8rem" }}>
    <MenuDivider />
  </div>
);

export const MenuDividerStory = Template.bind({});
MenuDividerStory.storyName = "Menu Divider";
