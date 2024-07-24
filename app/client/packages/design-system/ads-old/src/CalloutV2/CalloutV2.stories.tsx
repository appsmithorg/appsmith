import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import CalloutV2 from "./index";

export default {
  title: "Design System/Callout",
  component: CalloutV2,
} as ComponentMeta<typeof CalloutV2>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof CalloutV2> = (args) => {
  return <CalloutV2 {...args} />;
};

export const CalloutV2Example = Template.bind({}) as StoryObj;
CalloutV2Example.storyName = "CalloutV2";
CalloutV2Example.args = {
  // actionLabel: calloutBanner.actionLabel,
  actionLabel: "The action label",
  desc: "Here is a description",
  type: "Info",
};
