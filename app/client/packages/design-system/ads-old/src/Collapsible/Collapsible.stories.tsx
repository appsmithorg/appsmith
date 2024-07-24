import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import Collapsible from "./index";

export default {
  title: "Design System/Collapsible",
  component: Collapsible,
} as ComponentMeta<typeof Collapsible>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Collapsible> = (args) => (
  <Collapsible {...args} />
);

export const CollapsibleExample = Template.bind({}) as StoryObj;
CollapsibleExample.storyName = "Collapsible";
CollapsibleExample.args = {
  title: "This is a collapsible",
  children: (
    <>
      <div>Here is some content</div>
      <div>Here is some content</div>
      <div>Here is some content</div>
    </>
  ),
};
