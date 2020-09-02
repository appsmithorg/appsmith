import React from "react";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "./Tabs.stories";
import { action } from "@storybook/addon-actions";
import Toggle from "components/ads/Toggle";

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
