import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import DisplayImageUploadComponent from "./index";

export default {
  title: "Design System/DisplayImageUpload",
  component: DisplayImageUploadComponent,
} as ComponentMeta<typeof DisplayImageUploadComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof DisplayImageUploadComponent> = (args) => {
  return <DisplayImageUploadComponent {...args} />;
};

export const DisplayImageUpload = Template.bind({});
// DisplayImageUpload.args = {
//   //add arguments here
// };
