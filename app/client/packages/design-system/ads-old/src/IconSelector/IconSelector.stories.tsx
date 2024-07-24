import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import IconSelectorComponent from "./index";

export default {
  title: "Design System/IconSelector",
  component: IconSelectorComponent,
} as ComponentMeta<typeof IconSelectorComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof IconSelectorComponent> = (args) => {
  return <IconSelectorComponent {...args} />;
};

export const IconSelector = Template.bind({}) as StoryObj;
IconSelector.args = {
  selectedColor: "#F9936B",
};
