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

export function TextInputStory() {
  return (
    <StoryWrapper>
      <TextInput
        defaultValue={text("defaultValue", "This is valid")}
        disabled={boolean("disabled", false)}
        fill={boolean("fill", true)}
        onChange={action("input value changed")}
        placeholder={text("placeholder", "Your name")}
        validator={() => callValidator1()}
      />
    </StoryWrapper>
  );
}

const callValidator2 = () => {
  return {
    isValid: false,
    message: "This is a warning text for the above field.",
  };
};

export function ErrorTextInputStory() {
  return (
    <StoryWrapper>
      <TextInput
        defaultValue={text("defaultValue", "This is wrong")}
        disabled={boolean("disabled", false)}
        fill={boolean("fill", true)}
        onChange={(value) => console.log(value)}
        placeholder={text("placeholder", "Your name")}
        validator={() => callValidator2()}
      />
    </StoryWrapper>
  );
}
