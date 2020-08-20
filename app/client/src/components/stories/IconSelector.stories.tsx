import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import IconSelector from "../ads/IconSelector";
import { action } from "@storybook/addon-actions";

export default {
  title: "IconSelector",
  component: IconSelector,
  decorators: [withKnobs, withDesign],
};

export const IconSelectorStory = () => (
  <div style={{ padding: "50px", background: "#2B2B2B", height: "500px" }}>
    <IconSelector
      onSelect={action("icon-selected")}
      isFill={boolean("fill", false)}
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
  </div>
);
