import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { TooltipComponent } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/Tooltip",
  component: TooltipComponent,
} as ComponentMeta<typeof TooltipComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TooltipComponent> = (args) => (
  <TooltipComponent {...args}>Hover over me 😁</TooltipComponent>
);

export const Tooltip = Template.bind({});

Tooltip.args = {
  hoverOpenDelay: 200,
  content: "Something helpful you can put here 💁",
};
