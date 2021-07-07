import React from "react";
import { action } from "@storybook/addon-actions";
import ColorSelector from "components/ads/ColorSelector";
import { withKnobs, array, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
// import { appCardColors } from "constants/AppConstants";
import { StoryWrapper } from "components/ads/common";
import { theme } from "constants/DefaultTheme";

export default {
  title: "ColorSelector",
  component: ColorSelector,
  decorators: [withKnobs, withDesign],
};

const defaultValue = theme.colors.appCardColors;

export function ColorPickerStory() {
  return (
    <StoryWrapper>
      <ColorSelector
        colorPalette={array("colorPalette", defaultValue)}
        fill={boolean("fill", false)}
        onSelect={action("color-picker")}
      />
    </StoryWrapper>
  );
}
