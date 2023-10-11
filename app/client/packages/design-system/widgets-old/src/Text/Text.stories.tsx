import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Text as TextComponent, TextType } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/Text",
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
