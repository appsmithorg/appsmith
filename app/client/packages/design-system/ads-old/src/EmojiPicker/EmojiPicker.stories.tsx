import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import EmojiPickerComponent from "./index";

export default {
  title: "Design System/EmojiPicker",
  component: EmojiPickerComponent,
} as ComponentMeta<typeof EmojiPickerComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof EmojiPickerComponent> = (args) => {
  return <EmojiPickerComponent {...args} />;
};

export const EmojiPicker = Template.bind({}) as StoryObj;
EmojiPicker.args = {
  iconName: "book-line",
  onSelectEmoji: (e, emojiObject) => {
    // eslint-disable-next-line no-console
    console.log(emojiObject);
  },
};
