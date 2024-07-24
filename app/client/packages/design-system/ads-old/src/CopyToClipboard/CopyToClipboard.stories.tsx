import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import CopyToClipboard from "./index";

export default {
  title: "Design System/Copy To Clipboard",
  component: CopyToClipboard,
} as ComponentMeta<typeof CopyToClipboard>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof CopyToClipboard> = (args) => {
  return <CopyToClipboard {...args} />;
};

export const CopyToClipboardExample = Template.bind({}) as StoryObj;
CopyToClipboardExample.storyName = "Copy to Clipboard";
CopyToClipboardExample.args = {
  copyText:
    "Here is some text that will be copied into your clipboard if you click the button!",
};
