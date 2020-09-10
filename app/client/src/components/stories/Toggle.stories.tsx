import React from "react";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import Toggle from "components/ads/Toggle";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Toggle",
  component: Toggle,
  decorators: [withKnobs, withDesign],
};

export const CustomToggle = () => (
  <StoryWrapper>
    <Toggle
      value={boolean("switchOn", false)}
      disabled={boolean("disabled", false)}
      isLoading={boolean("isLoading", false)}
      onToggle={action("toggle-on")}
    />
  </StoryWrapper>
);
