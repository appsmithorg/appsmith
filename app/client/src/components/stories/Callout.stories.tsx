import React from "react";
import { withKnobs, select, text, boolean } from "@storybook/addon-knobs";
import Callout from "components/ads/Callout";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Callout",
  component: Callout,
  decorators: [withKnobs],
};

export const CalloutStory = () => (
  <StoryWrapper>
    <Callout
      text={text("text", "Lorem ipsum dolar sit adicipling dolare")}
      variant={select("variant", ["note", "warning"], "note")}
      background={select("background", ["light", "dark"], "dark")}
      fill={boolean("fill", false)}
    />
  </StoryWrapper>
);
