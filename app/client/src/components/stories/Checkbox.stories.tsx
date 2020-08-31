import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "./Tabs.stories";
import { action } from "@storybook/addon-actions";
import CheckboxComponent from "../ads/Checkbox";

export default {
  title: "Checkbox",
  component: CheckboxComponent,
  decorators: [withKnobs, withDesign],
};

export const Checkbox = () => (
  <StoryWrapper>
    <CheckboxComponent
      label={text("label", "Checked")}
      isChecked={boolean("isChecked", false)}
      disabled={boolean("disabled", false)}
      onCheckChange={action("check-change")}
      align={select("align", ["left", "right"], "left")}
    />
  </StoryWrapper>
);
