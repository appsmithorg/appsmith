import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import AppIconComponent from "./index";

export default {
  title: "Design System/AppIcon",
  component: AppIconComponent,
} as ComponentMeta<typeof AppIconComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof AppIconComponent> = (args) => {
  return <AppIconComponent {...args} />;
};

export const AppIcon = Template.bind({}) as StoryObj;
AppIcon.args = {
  name: "arrow-down",
  size: "large",
};
