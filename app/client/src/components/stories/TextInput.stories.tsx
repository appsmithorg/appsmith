import React from "react";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import TextInput, { TextInputProps } from "components/ads/TextInput";
import { IconCollection } from "components/ads/Icon";
import { action } from "@storybook/addon-actions";
import { StoryWrapper } from "components/ads/common";
import {
  Title,
  Subtitle,
  Description,
  Primary,
  ArgsTable,
  Stories,
  PRIMARY_STORY,
} from "@storybook/addon-docs";
import { Meta, Story } from "@storybook/react";

const docDefine = () => (
  <>
    <Title />
    <Subtitle />
    <Description />
    <Primary />
    <ArgsTable story={PRIMARY_STORY} />
    <Stories />
  </>
);
docDefine.displayName = "DocDefine";

export default {
  title: "Text Input",
  component: TextInput,
  decorators: [withKnobs],
  argTypes: {
    leftIcon: {
      options: [undefined, ...IconCollection],
      control: { type: "select" },
    },
  },
  parameters: {
    docs: {
      page: docDefine,
    },
  },
} as Meta;

// valid of validator
const callValid = () => {
  return {
    isValid: true,
    message: "",
  };
};

// invalid of validator
const callInvalid = () => {
  return {
    isValid: false,
    message: "This is a warning text for the above field.",
  };
};

const Template: Story<TextInputProps> = (args) => (
  <StoryWrapper>
    <TextInput
      {...args}
      onChange={action("input value changed")}
      validator={() => callValid()}
    />
  </StoryWrapper>
);

const ErrorTemplate: Story<TextInputProps> = (args) => {
  return (
    <StoryWrapper>
      <TextInput
        {...args}
        onChange={action("input value changed")}
        validator={() => callInvalid()}
      />
    </StoryWrapper>
  );
};

//Normal Text Input
export const Default = Template.bind({});
Default.args = {
  placeholder: "Placeholder",
  fill: false,
  defaultValue: "",
  readOnly: false,
  helperText: "",
  disabled: false,
  leftIcon: undefined,
};

// export const ErrorTextInput = ErrorTemplate.bind({});
// ErrorTextInput.args = {
//   placeholder: "Placeholder",
//   fill: false,
//   defaultValue: "",
//   readOnly: false,
//   helperText: "",
//   disabled: false,
//   leftIcon: undefined,
// };

// export const Secondary = Template.bind({});
// Secondary.args = { ...Primary.args, label: "😄👍😍💯" };

// export const Tertiary = Template.bind({});
// Tertiary.args = { ...Primary.args, label: "📚📕📈🤓" };

export function ErrorTextInputStory() {
  return (
    <StoryWrapper>
      <TextInput
        defaultValue={text("defaultValue", "This is valid")}
        disabled={boolean("disabled", false)}
        fill={boolean("fill", true)}
        onChange={action("input value changed")}
        placeholder={text("placeholder", "Your name")}
        validator={() => callInvalid()}
      />
    </StoryWrapper>
  );
}

export function ErrorTextInputWithIconStory() {
  return (
    <StoryWrapper>
      <TextInput
        defaultValue={text("defaultValue", "This is valid")}
        disabled={boolean("disabled", false)}
        fill={boolean("fill", true)}
        leftIcon="book"
        onChange={action("input value changed")}
        placeholder={text("placeholder", "Your name")}
        validator={() => callInvalid()}
      />
    </StoryWrapper>
  );
}
