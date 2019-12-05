import React from "react";
import TextInputComponent from "components/designSystems/appsmith/TextInputComponent";
import { withKnobs, text, boolean, select } from "@storybook/addon-knobs";
import { IconNames } from "@blueprintjs/icons";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "TextInput",
  component: TextInputComponent,
  decorators: [withKnobs, withDesign],
};

const mandatoryProps = {
  widgetId: "abc",
};

const iconNames = Object.values({ ...IconNames });
iconNames.unshift();
export const withDynamicProps = () => (
  <TextInputComponent
    {...mandatoryProps}
    showError={boolean("Show Errors", false)}
    placeholder={text("Placeholder", "Placeholder")}
    meta={{
      touched: true,
      error: text("Error Text", "This is an error"),
    }}
    icon={select("Icon", iconNames, undefined)}
  />
);

withDynamicProps.story = {
  name: "Dynamic Props",
  parameters: {
    design: {
      type: "figma",
      url:
        "https://www.figma.com/file/moGQyQffFfyUhHUMO9xqn3/Appsmith-v1.0-Final?node-id=1821%3A5093",
    },
  },
};
