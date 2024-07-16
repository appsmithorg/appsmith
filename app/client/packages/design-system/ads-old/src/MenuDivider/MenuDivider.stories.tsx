import React from "react";
import type { ComponentMeta } from "@storybook/react";
import { ComponentStory } from "@storybook/react";

import MenuDivider from "./index";

export default {
  title: "Design System/Menu Divider",
  component: MenuDivider,
} as ComponentMeta<typeof MenuDivider>;

export const MenuDividerExample = (
  <div style={{ minWidth: "8rem" }}>
    <MenuDivider />
  </div>
);
