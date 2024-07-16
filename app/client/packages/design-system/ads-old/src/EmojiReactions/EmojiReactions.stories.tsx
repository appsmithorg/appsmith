import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import EmojiReactionsComponent from "./index";

export default {
  title: "Design System/EmojiReactions",
  component: EmojiReactionsComponent,
} as ComponentMeta<typeof EmojiReactionsComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof EmojiReactionsComponent> = (args) => {
  return <EmojiReactionsComponent {...args} />;
};

export const EmojiReactions = Template.bind({});
EmojiReactions.args = {
  onSelectReaction: (...data: any) => {
    // eslint-disable-next-line no-console
    console.log(data);
  },
};
