import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import CloseButton from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/CloseButton",
  component: CloseButton,
} as ComponentMeta<typeof CloseButton>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof CloseButton> = (args) => {
  return <CloseButton {...args} />;
};

export const CloseButtonExample = Template.bind({});
CloseButtonExample.storyName = "Close Button";
CloseButtonExample.args = {
  color: "#682377",
  size: 12,
  onClick: () => console.log("clicked"),
};
