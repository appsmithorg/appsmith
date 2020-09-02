import React from "react";
import {
  withKnobs,
  select,
  boolean,
  text,
  number,
} from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "./Tabs.stories";
import RadioComponent from "components/ads/Radio";
import { action } from "@storybook/addon-actions";

export default {
  title: "Radio",
  component: RadioComponent,
  decorators: [withKnobs, withDesign],
};

export const Radio = () => (
  <StoryWrapper style={{ height: "300px" }}>
    <RadioComponent
      defaultValue={select(
        "defaultValue",
        ["React", "Angular", "Vue"],
        "React",
      )}
      align={select(
        "Alignment",
        ["horizontal", "vertical", "column", "row"],
        "horizontal",
      )}
      disabled={boolean("Radio group disabled", false)}
      columns={number("Column number", 2)}
      rows={number("Row number", 2)}
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
  </StoryWrapper>
);
