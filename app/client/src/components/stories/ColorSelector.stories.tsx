import React from "react";
import { action } from "@storybook/addon-actions";
import ColorSelector from "components/ads/ColorSelector";
import { withKnobs, array, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "./Tabs.stories";
import { appCardColors } from "constants/AppConstants";

export default {
  title: "ColorSelector",
  component: ColorSelector,
  decorators: [withKnobs, withDesign],
};

const defaultValue = appCardColors;

export const ColorPickerStory = () => (
  <StoryWrapper>
    <ColorSelector
      onSelect={action("color-picker")}
      fill={boolean("fill", false)}
      colorPalette={array("colorPalette", defaultValue)}
    />
  </StoryWrapper>
);
