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

export function CustomToggle() {
  return (
    <StoryWrapper>
      <Toggle
        disabled={boolean("disabled", false)}
        isLoading={boolean("isLoading", false)}
        onToggle={action("toggle-on")}
        value={boolean("switchOn", false)}
      />
    </StoryWrapper>
  );
}
