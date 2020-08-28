import React from "react";
import { withKnobs, select } from "@storybook/addon-knobs";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/Button";
import { StoryWrapper } from "./Tabs.stories";

export default {
  title: "Callout",
  component: Callout,
  decorators: [withKnobs],
};

export const CalloutStory = () => (
  <StoryWrapper>
    <Callout
      text="Lorem ipsum dolar sit adicipling dolare."
      variant={select(
        "variant",
        [Variant.success, Variant.danger, Variant.info, Variant.warning],
        Variant.success,
      )}
    />
  </StoryWrapper>
);
