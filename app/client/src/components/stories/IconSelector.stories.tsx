import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import IconSelector from "components/ads/IconSelector";
import { action } from "@storybook/addon-actions";
import { AppIconName } from "components/ads/AppIcon";
import { StoryWrapper } from "./Tabs.stories";

export default {
  title: "IconSelector",
  component: IconSelector,
  decorators: [withKnobs, withDesign],
};

export const IconPicker = () => (
  <StoryWrapper>
    <IconSelector
      onSelect={action("icon-selected")}
      fill={boolean("fill", false)}
      selectedIcon={select(
        "select icon",
        [
          AppIconName.BAG,
          AppIconName.PRODUCT,
          AppIconName.BOOK,
          AppIconName.CAMERA,
          AppIconName.FILE,
          AppIconName.CHAT,
          AppIconName.CALENDER,
          AppIconName.FLIGHT,
          AppIconName.FRAME,
          AppIconName.GLOBE,
          AppIconName.SHOPPER,
          AppIconName.HEART,
        ],
        AppIconName.BAG,
      )}
      selectedColor={select(
        "select color",
        [
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
        "#54A9FB",
      )}
    />
  </StoryWrapper>
);
