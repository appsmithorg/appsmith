import React from "react";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import Checkbox from "components/ads/Checkbox";
import { StoryWrapper } from "components/ads/common";

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
