import React from "react";
import FilePicker, { CloudinaryUploader, FileType } from "../ads/FilePicker";

export default {
  title: "FilePicker",
  component: FilePicker,
};

function ShowUploadedFile(data: any) {
  console.log(data);
}

export const withDynamicProps = () => (
  <FilePicker
    fileType={FileType.IMAGE}
    fileUploader={CloudinaryUploader}
    onFileUploaded={(data) => ShowUploadedFile(data)}
  />
);

export const withJsonInputType = () => (
  <FilePicker
    fileType={FileType.JSON}
    fileUploader={CloudinaryUploader}
    onFileUploaded={(data) => ShowUploadedFile(data)}
  />
);
