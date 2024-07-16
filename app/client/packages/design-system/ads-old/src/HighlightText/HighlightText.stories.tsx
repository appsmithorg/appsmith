import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { HighlightText } from "./index";

export default {
  title: "Design System/Highlight Text",
  component: HighlightText,
} as ComponentMeta<typeof HighlightText>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof HighlightText> = (args) => (
  <HighlightText {...args} />
);

export const HighlightTextExample = Template.bind({});
HighlightTextExample.storyName = "Highlight Text";
HighlightTextExample.args = {
  highlight: "some",
  text: "here is some highlighted text",
};
