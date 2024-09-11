import React from "react";
import { Tag } from "./Tag";
import type { TagProps } from "./Tag.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Tag",
  component: Tag,
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: TagProps) => {
  return <Tag {...args} />;
};

export const TagStory = Template.bind({}) as StoryObj;
TagStory.storyName = "Tag";
TagStory.args = {
  children: "contact@appsmith.com",
  isClosable: false,
  size: "sm",
};

export const SpecialTag = Template.bind({}) as StoryObj;
SpecialTag.args = {
  ...TagStory.args,
  children: "Enterprise",
  kind: "special",
};

export const PremiumTag = Template.bind({}) as StoryObj;
PremiumTag.args = {
  ...TagStory.args,
  children: "Business Edition",
  kind: "premium",
};

export const TagCloseStory = Template.bind({}) as StoryObj;
TagCloseStory.args = {
  ...TagStory.args,
  isClosable: true,
};
