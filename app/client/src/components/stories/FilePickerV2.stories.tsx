import React from "react";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import {
  CloudinaryUploader,
  FileType,
  FilePickerProps,
} from "../ads/FilePicker";
import FilePickerV2 from "components/ads/FilePickerV2";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.filePickerV2.PATH,
  component: FilePickerV2,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: FilePickerProps) {
  return (
    <div style={{ width: 383 }}>
      <FilePickerV2
        {...args}
        onFileRemoved={action("file-removed")}
        onFileUploaded={action("file-upload")}
      />
    </div>
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

Primary.storyName = storyName.platform.form.filePickerV2.NAME;
