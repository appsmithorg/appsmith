import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { BannerMessage as BannerMessageComponent } from "./index";
import { IconSize } from "../Icon";

export default {
  title: "Design System/BannerMessage",
  component: BannerMessageComponent,
} as ComponentMeta<typeof BannerMessageComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof BannerMessageComponent> = (args) => {
  return <BannerMessageComponent {...args} />;
};

export const BannerMessage = Template.bind({}) as StoryObj;
BannerMessage.args = {
  backgroundColor: "#FFF8E2",
  className: "t--deprecation-warning",
  icon: "warning-line",
  iconColor: "#FEB811",
  iconSize: IconSize.XXXXL,
  message: "Some banner message",
  textColor: "#864C17",
};
