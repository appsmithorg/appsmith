import React from "react";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import TextInput from "components/ads/TextInput";
import { action } from "@storybook/addon-actions";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Text Input",
  component: TextInput,
  decorators: [withKnobs],
};

const callValidator1 = () => {
  return {
    isValid: true,
    message: "",
  };
};

export const TextInputStory = () => (
  <StoryWrapper>
    <TextInput
      placeholder={text("placeholder", "Your name")}
      disabled={boolean("disabled", false)}
      fill={boolean("fill", true)}
      defaultValue={text("defaultValue", "This is valid")}
      onChange={action("input value changed")}
      validator={() => callValidator1()}
    ></TextInput>
  </StoryWrapper>
);

const callValidator2 = () => {
  return {
    isValid: false,
    message: "This is a warning text for the above field.",
  };
};

export const ErrorTextInputStory = () => (
  <StoryWrapper>
    <TextInput
      placeholder={text("placeholder", "Your name")}
      disabled={boolean("disabled", false)}
      fill={boolean("fill", true)}
      onChange={value => console.log(value)}
      defaultValue={text("defaultValue", "This is wrong")}
      validator={() => callValidator2()}
    ></TextInput>
  </StoryWrapper>
);
