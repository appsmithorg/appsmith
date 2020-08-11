import React from "react";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import TextInput from "../ads/TextInput";
import { action } from "@storybook/addon-actions";

export default {
  title: "Text Input",
  component: TextInput,
  decorators: [withKnobs],
};

const callValidator1 = () => {
  return {
    isValid: true,
    message: "This is a warning text for the above field.",
  };
};

export const TextInputStory = () => (
  <div style={{ background: "#302D2D", height: "500px", padding: "100px" }}>
    <TextInput
      placeholder={text("placeholder", "Place")}
      value={text("value", "")}
      isDisabled={boolean("isDisabled", false)}
      fill={boolean("fill", true)}
      onChange={action("value changed")}
      validator={() => callValidator1()}
    ></TextInput>
  </div>
);

const callValidator2 = () => {
  return {
    isValid: false,
    message: "This is a warning text for the above field.",
  };
};

export const ErrorTextInputStory = () => (
  <div style={{ background: "#302D2D", height: "500px", padding: "100px" }}>
    <TextInput
      placeholder={text("placeholder", "Place")}
      value={text("value", "")}
      isDisabled={boolean("isDisabled", false)}
      fill={boolean("fill", true)}
      onChange={action("value changed")}
      validator={() => callValidator2()}
    ></TextInput>
  </div>
);
