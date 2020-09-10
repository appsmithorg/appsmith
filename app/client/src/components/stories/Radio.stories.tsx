import React from "react";
import {
  withKnobs,
  select,
  boolean,
  text,
  number,
} from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "components/ads/common";
import RadioComponent from "components/ads/Radio";
import { action } from "@storybook/addon-actions";

export default {
  title: "Radio",
  component: RadioComponent,
  decorators: [withKnobs, withDesign],
};

export const Radio = () => (
  <StoryWrapper>
    <div style={{ height: "133px" }}>
      <RadioComponent
        defaultValue={select(
          "defaultValue",
          ["React", "Angular", "Vue"],
          "React",
        )}
        columns={number("Column number", 2)}
        rows={number("Row number", 2)}
        disabled={boolean("Radio group disabled", false)}
        onSelect={action("selected-radio-option")}
        options={[
          {
            label: "React",
            value: "React",
            onSelect: action("first-radio-option"),
            disabled: boolean("Option-1-disabled", false),
          },
          {
            label: "Angular",
            value: "Angular",
            onSelect: action("second-radio-option"),
            disabled: boolean("Option-2-disabled", false),
          },
          {
            label: "Vue",
            value: "Vue",
            onSelect: action("third-radio-option"),
            disabled: boolean("Option-3-disabled", false),
          },
        ]}
      />
    </div>
  </StoryWrapper>
);
