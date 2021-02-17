import React from "react";
import { withKnobs, select, text, boolean } from "@storybook/addon-knobs";
import Callout from "components/alloy/Callout";
import { StoryWrapper, Variant } from "components/alloy/common";

export default {
  title: "Callout",
  component: Callout,
  decorators: [withKnobs],
};

export const CalloutStory = () => (
  <StoryWrapper>
    <Callout
      text={text("text", "Lorem ipsum dolar sit adicipling dolare")}
      fill={boolean("fill", false)}
      variant={select("variant", Object.values(Variant), Variant.info)}
    />
  </StoryWrapper>
);
