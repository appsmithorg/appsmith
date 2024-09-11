import React from "react";
import { Avatar } from "./Avatar";
import type { AvatarProps } from "./Avatar.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Avatar",
  component: Avatar,
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: AvatarProps) => {
  return <Avatar {...args} />;
};

export const AvatarStory = Template.bind({}) as StoryObj;
AvatarStory.storyName = "Avatar";
AvatarStory.args = {
  label: "Avatar",
  isTooltipEnabled: true,
};

export const AvatarInitialStory = Template.bind({}) as StoryObj;
AvatarInitialStory.args = {
  firstLetter: "A",
};

export const AvatarFallbackInitial = Template.bind({}) as StoryObj;
AvatarFallbackInitial.args = {
  label: "appsmith",
};

export const AvatarSmallStory = Template.bind({}) as StoryObj;
AvatarSmallStory.args = {
  size: "sm",
};

export const AvatarMediumStory = Template.bind({}) as StoryObj;
AvatarMediumStory.args = {
  size: "md",
};
