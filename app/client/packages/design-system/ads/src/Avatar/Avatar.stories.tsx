import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Avatar } from "./Avatar";

export default {
  title: "ADS/Avatar",
  component: Avatar,
} as ComponentMeta<typeof Avatar>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Avatar> = (args) => {
  return <Avatar {...args} />;
};

export const AvatarStory = Template.bind({});
AvatarStory.storyName = "Avatar";
AvatarStory.args = {
  image: "https://picsum.photos/200/300",
  label: "Avatar",
  isTooltipEnabled: true,
};

export const AvatarInitialStory = Template.bind({});
AvatarInitialStory.args = {
  firstLetter: "A",
};

export const AvatarFallbackInitial = Template.bind({});
AvatarFallbackInitial.args = {
  label: "appsmith",
};

export const AvatarSmallStory = Template.bind({});
AvatarSmallStory.args = {
  size: "sm",
};

export const AvatarMediumStory = Template.bind({});
AvatarMediumStory.args = {
  size: "md",
};
