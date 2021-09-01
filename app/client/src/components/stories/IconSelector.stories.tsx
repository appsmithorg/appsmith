import React from "react";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import IconSelector from "components/ads/IconSelector";
import { action } from "@storybook/addon-actions";
import { AppIconCollection } from "components/ads/AppIcon";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "IconSelector",
  component: IconSelector,
  decorators: [withKnobs, withDesign],
};

export function IconPicker() {
  return (
    <StoryWrapper>
      <IconSelector
        fill={boolean("fill", false)}
        onSelect={action("icon-selected")}
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
        selectedIcon={select("select icon", AppIconCollection, "bag")}
      />
    </StoryWrapper>
  );
}
