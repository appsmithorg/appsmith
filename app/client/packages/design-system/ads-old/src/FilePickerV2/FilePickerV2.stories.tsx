import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import FilePickerV2, { FileType } from "./index";

export default {
  title: "Design System/File Picker V2",
  component: FilePickerV2,
} as ComponentMeta<typeof FilePickerV2>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof FilePickerV2> = (args) => {
  return <FilePickerV2 {...args} />;
};

export const FilePicker = Template.bind({}) as StoryObj;
FilePicker.args = {
  containerClickable: true,
  description: "Drag and drop your file or upload from your computer",
  fileType: FileType.JSON,
  fileUploader: () => {
    console.log("upload file function here ");
  },
  title: "Import from file",
  uploadIcon: "file-line",
};
