import React from "react";
import { action } from "@storybook/addon-actions";
import ColorSelector, { appColorPalette } from "components/ads/ColorSelector";
import { withKnobs, array, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "ColorSelector",
  component: ColorSelector,
  decorators: [withKnobs, withDesign],
};

const defaultValue = appColorPalette;

export const ColorPickerStory = () => (
  <div style={{ background: "#2B2B2B", padding: "50px", height: "500px" }}>
    <ColorSelector
      onSelect={action("color-picker")}
      fill={boolean("fill", false)}
      colorPalette={array("colorPalette", defaultValue)}
    />
  </div>
);
