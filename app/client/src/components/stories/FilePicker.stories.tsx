import React from "react";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import FilePicker, {
  CloudinaryUploader,
  FileType,
  FilePickerProps,
} from "../ads/FilePicker";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.filePicker.PATH,
  component: FilePicker,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: FilePickerProps) {
  return (
    <FilePicker
      {...args}
      onFileRemoved={action("file-removed")}
      onFileUploaded={action("file-upload")}
    />
  );
}

Primary.args = {
  fileType: FileType.IMAGE,
  fileUploader: CloudinaryUploader,
  url: "",
  logoUploadError: "Upload failed",
  delayedUpload: false,
};

Primary.argTypes = {
  fileType: {
    control: controlType.SELECT,
    options: Object.values(FileType),
  },
  url: { control: controlType.TEXT },
  logoUploadError: { control: controlType.TEXT },
  delayedUpload: { control: controlType.BOOLEAN },
};

Primary.storyName = storyName.platform.form.filePicker.NAME;
