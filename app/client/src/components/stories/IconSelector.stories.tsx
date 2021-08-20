import React from "react";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import IconSelector, { IconSelectorProps } from "components/ads/IconSelector";
import { action } from "@storybook/addon-actions";
import { AppIconCollection } from "components/ads/AppIcon";
import { StoryWrapper } from "components/ads/common";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.icons.iconSelector.PATH,
  component: IconSelector,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function IconSelectorStory(args: IconSelectorProps) {
  return <IconSelector {...args} onSelect={action("icon-selected")} />;
}

IconSelectorStory.args = {
  selectedColor: "#54A9FB",
  selectedIcon: "bag",
  iconPalette: AppIconCollection,
  fill: false,
};

IconSelectorStory.argTypes = {
  selectedColor: {
    control: controlType.SELECT,
    options: [
      "#4F70FD",
      "#54A9FB",
      "#5ED3DA",
      "#F56AF4",
      "#F36380",
      "#FE9F44",
      "#E9C951",
      "#A8D76C",
      "#6C4CF1",
    ],
  },
  selectedIcon: {
    control: controlType.SELECT,
    options: AppIconCollection,
  },
  iconPalette: {
    control: controlType.ARRAY,
    options: AppIconCollection,
  },
  fill: { control: controlType.BOOLEAN },
};

IconSelectorStory.storyName = storyName.platform.icons.iconSelector.NAME;
