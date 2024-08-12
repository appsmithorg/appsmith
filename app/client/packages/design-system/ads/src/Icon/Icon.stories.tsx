import React from "react";
import { Icon } from "./Icon";
import type { IconProps } from "./Icon.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Icon",
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          "Icon component which accepts name of any remix icon or any custom svg element.",
      },
    },
  },
  argTypes: {
    // adding this specifically to bring that sorting order in storybook
    size: {
      options: ["sm", "md", "lg"],
      control: { type: "radio" },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: IconProps) => {
  return <Icon {...args} />;
};

export const IconStory = Template.bind({}) as StoryObj;
IconStory.storyName = "Icon";
IconStory.args = {
  name: "account-box-line",
  children: "",
  size: "md",
  withWrapper: false,
};

export const SmallIconStory = Template.bind({}) as StoryObj;
SmallIconStory.storyName = "Small Icon";
SmallIconStory.args = {
  ...IconStory.args,
  size: "sm",
};

export const MediumIconStory = Template.bind({}) as StoryObj;
MediumIconStory.storyName = "Medium Icon";
MediumIconStory.args = {
  ...IconStory.args,
  size: "md",
};

export const LargeIconStory = Template.bind({}) as StoryObj;
LargeIconStory.storyName = "Large Icon";
LargeIconStory.args = {
  ...IconStory.args,
  size: "lg",
};

export const ColoredIconStory = Template.bind({}) as StoryObj;
ColoredIconStory.storyName = "Icon with custom color";
ColoredIconStory.args = {
  ...IconStory.args,
  size: "lg",
  color: "pink",
};
