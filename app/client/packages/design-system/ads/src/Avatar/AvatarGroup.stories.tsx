import React from "react";

import { AvatarGroup } from "./Avatar";

export default {
  title: "ADS/Avatar/Avatar Group",
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
} as ComponentMeta<typeof AvatarGroup>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof AvatarGroup> = (args) => {
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
      image: "https://picsum.photos/200/300?random=2",
      label: "wilfred@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=3",
      label: "dsouza@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=4",
      label: "someoneelse@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=5",
      label: "againsomeone@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=6",
      label: "thereisananotherone@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=7",
      label: "lastoneIguess@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=8",
      label: "noonemore@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=6",
      label: "thereisananotherone@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=7",
      label: "lastoneIguess@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=8",
      label: "noonemore@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=6",
      label: "thereisananotherone@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=7",
      label: "lastoneIguess@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=8",
      label: "noonemore@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=6",
      label: "thereisananotherone@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=7",
      label: "lastoneIguess@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=8",
      label: "noonemore@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=6",
      label: "thereisananotherone@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=7",
      label: "lastoneIguess@appsmith.com",
    },
    {
      image: "https://picsum.photos/200/300?random=8",
      label: "noonemore@appsmith.com",
    },
  ],
  size: "sm",
};
