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
  <StoryWrapper>
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
      rowsHeight={text("rowsHeight", "300px")}
      onSelect={action("selected-radio-option")}
      options={[
        {
          label: "React",
          value: "React",
          disabled: boolean("Option-1-disabled", false),
        },
        {
          label: "Angular",
          value: "Angular",
          disabled: boolean("Option-2-disabled", false),
        },
        {
          label: "Vue",
          value: "Vue",
          disabled: boolean("Option-3-disabled", false),
        },
      ]}
    />
  </StoryWrapper>
);
