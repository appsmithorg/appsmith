import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Tag } from "./Tag";

export default {
  title: "ADS/Tag",
  component: Tag,
} as ComponentMeta<typeof Tag>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Tag> = (args) => {
  return <Tag {...args} />;
};

export const TagStory = Template.bind({});
TagStory.storyName = "Tag";
TagStory.args = {
  children: "contact@appsmith.com",
  isClosable: false,
  size: "sm",
};

export const SpecialTag = Template.bind({});
SpecialTag.args = {
  ...TagStory.args,
  children: "Enterprise",
  kind: "special",
};

export const PremiumTag = Template.bind({});
PremiumTag.args = {
  ...TagStory.args,
  children: "Business Edition",
  kind: "premium",
};

export const TagCloseStory = Template.bind({});
TagCloseStory.args = {
  ...TagStory.args,
  isClosable: true,
};
