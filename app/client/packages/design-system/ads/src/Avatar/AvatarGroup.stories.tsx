import React from "react";
import { AvatarGroup } from "./Avatar";
import type { StoryObj } from "@storybook/react";
import type { AvatarGroupProps } from "./Avatar.types";

export default {
  title: "ADS/Components/Avatar/Avatar Group",
  component: AvatarGroup,
  docs: {
    autodocs: false,
  },
  argTypes: {
    avatars: {
      control: {
        type: "object",
      },
      description: "List of avatars to be displayed",
    },
    maxAvatars: {
      control: {
        type: "number",
      },
      description: "Maximum number of avatars to be displayed",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: 3,
        },
      },
    },
    size: {
      control: {
        type: "select",
        options: ["sm", "md"],
      },
      description: "Size of the avatar",
      table: {
        type: {
          summary: "sm | md",
        },
        defaultValue: {
          summary: "sm",
        },
      },
    },
    tooltipPlacement: {
      control: {
        type: "select",
        options: [
          "left",
          "right",
          "top",
          "bottom",
          "topLeft",
          "topRight",
          "bottomLeft",
          "bottomRight",
          "rightTop",
          "rightBottom",
          "leftTop",
          "leftBottom",
        ],
      },
      description: "Placement of the tooltip",
      table: {
        type: {
          summary:
            "left | right | top | bottom | topLeft | topRight | bottomLeft | bottomRight | rightTop | rightBottom | leftTop | leftBottom",
        },
        defaultValue: {
          summary: "bottom",
        },
      },
    },
    className: {
      control: {
        type: "text",
      },
      description: "Class name to be applied to the avatar group",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: AvatarGroupProps) => {
  return <AvatarGroup {...args} />;
};

export const AvatarGroupStory = Template.bind({}) as StoryObj;
AvatarGroupStory.storyName = "Avatar Group";
AvatarGroupStory.args = {
  avatars: [
    {
      label: "klaus@appsmith.com",
    },
    {
      image: "https://assets.appsmith.com/integrations/25720743.png",
      label: "wilfred@appsmith.com",
    },
    {
      label: "dsouza@appsmith.com",
    },
    {
      label: "someoneelse@appsmith.com",
    },
    {
      label: "againsomeone@appsmith.com",
    },
    {
      label: "thereisananotherone@appsmith.com",
    },
    {
      label: "lastoneIguess@appsmith.com",
    },
    {
      label: "noonemore@appsmith.com",
    },
    {
      label: "thereisananotherone@appsmith.com",
    },
    {
      label: "lastoneIguess@appsmith.com",
    },
    {
      label: "noonemore@appsmith.com",
    },
    {
      label: "thereisananotherone@appsmith.com",
    },
    {
      label: "lastoneIguess@appsmith.com",
    },
    {
      label: "noonemore@appsmith.com",
    },
    {
      label: "thereisananotherone@appsmith.com",
    },
    {
      label: "lastoneIguess@appsmith.com",
    },
    {
      label: "noonemore@appsmith.com",
    },
    {
      label: "thereisananotherone@appsmith.com",
    },
    {
      label: "lastoneIguess@appsmith.com",
    },
    {
      label: "noonemore@appsmith.com",
    },
  ],
  size: "sm",
};
