import React from "react";
import { withKnobs, select, text, boolean } from "@storybook/addon-knobs";
import Callout from "components/ads/Callout";
import { StoryWrapper, Variant } from "components/ads/common";

export default {
  title: "Callout",
  component: Callout,
  decorators: [withKnobs],
};

export function CalloutStory() {
  return (
    <StoryWrapper>
      <Callout
        fill={boolean("fill", false)}
        text={text("text", "Lorem ipsum dolar sit adicipling dolare")}
        variant={select("variant", Object.values(Variant), Variant.info)}
      />
    </StoryWrapper>
  );
}
