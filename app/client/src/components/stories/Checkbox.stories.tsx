import React from "react";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "./Tabs.stories";
import { action } from "@storybook/addon-actions";
import Checkbox from "components/ads/Checkbox";

export default {
  title: "Checkbox",
  component: Checkbox,
  decorators: [withKnobs, withDesign],
};

export const CustomCheckbox = () => (
  <StoryWrapper>
    <Checkbox
      label={text("label", "Checked")}
      disabled={boolean("disabled", false)}
      onCheckChange={action("check-change")}
    />
  </StoryWrapper>
);
