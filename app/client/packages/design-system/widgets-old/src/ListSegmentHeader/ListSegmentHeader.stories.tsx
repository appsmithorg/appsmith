import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import SegmentHeader from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/widgets-old/SegmentHeader",
  component: SegmentHeader,
} as ComponentMeta<typeof SegmentHeader>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof SegmentHeader> = (args: any) => {
  return <SegmentHeader {...args} />;
};

export const ListSegmentHeader = Template.bind({});
ListSegmentHeader.args = {
  title: "The Bee Movie",
};
