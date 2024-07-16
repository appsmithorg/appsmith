import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Icon } from "./Icon";

export default {
  title: "ADS/Icon",
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
} as ComponentMeta<typeof Icon>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Icon> = (args) => {
  return <Icon {...args} />;
};

export const IconStory = Template.bind({});
IconStory.storyName = "Icon";
IconStory.args = {
  name: "account-box-line",
  children: "",
  size: "md",
  withWrapper: false,
};

export const SmallIconStory = Template.bind({});
SmallIconStory.storyName = "Small Icon";
SmallIconStory.args = {
  ...IconStory.args,
  size: "sm",
};

export const MediumIconStory = Template.bind({});
MediumIconStory.storyName = "Medium Icon";
MediumIconStory.args = {
  ...IconStory.args,
  size: "md",
};

export const LargeIconStory = Template.bind({});
LargeIconStory.storyName = "Large Icon";
LargeIconStory.args = {
  ...IconStory.args,
  size: "lg",
};

export const ColoredIconStory = Template.bind({});
ColoredIconStory.storyName = "Icon with custom color";
ColoredIconStory.args = {
  ...IconStory.args,
  size: "lg",
  color: "pink",
};
