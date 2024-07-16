import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import TextComponent, { TextType } from "./index";

export default {
  title: "Design System/Text",
  component: TextComponent,
} as ComponentMeta<typeof TextComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TextComponent> = (args) => {
  return <TextComponent {...args}> Some Content 🍎 </TextComponent>;
};

export const Text = Template.bind({});
Text.args = {
  type: TextType.P0,
};
