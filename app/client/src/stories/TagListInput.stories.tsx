import React, { useState } from "react";
import TagInputComponent from "components/editorComponents/TagInputComponent";
import { withKnobs, text, select } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { IntentColors } from "constants/DefaultTheme";

export default {
  title: "TagListInput",
  component: TagInputComponent,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () =>
  React.createElement(() => {
    const [values, setValues] = useState(
      "abhinav, test@appsmith.com, test2@appsmith.com",
    );

    return (
      <TagInputComponent
        placeholder={text("Placeholder", "Placeholder")}
        input={{
          value: values,
          onChange: (value: string) => setValues(value),
        }}
        separator={text("Separator (string | RegExp)", ",")}
        type="email"
        intent={select("Intent", Object.keys(IntentColors), "success")}
      />
    );
  });

withDynamicProps.story = {
  name: "Dynamic Props",
  parameters: {
    design: {
      type: "figma",
      url:
        "https://www.figma.com/file/dcpKM4JTxsa7rd5MTcyJiT/Untitled?node-id=10%3A2",
    },
  },
};
