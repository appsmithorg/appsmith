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

export function CustomCheckbox() {
  return (
    <StoryWrapper>
      <Checkbox
        disabled={boolean("disabled", false)}
        label={text("label", "Checked")}
        onCheckChange={action("check-change")}
      />
    </StoryWrapper>
  );
}
